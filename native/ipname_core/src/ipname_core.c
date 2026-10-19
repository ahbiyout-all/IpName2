/**
 * ============================================================================
 * IpNameCore Native Dynamic Link Library (ipname_core.dll)
 * 
 * Implementation file for high-performance in-process network diagnostics,
 * Layer-2 ARP IP conflict detection, TCP port probing, and subnet calculations.
 * 
 * Project: AhBiYout IpName2
 * Author: AhBiYout (GitHub: https://github.com/AhBiYout-all)
 * Official Blog: https://ahbiyoutvibe.blogspot.com/
 * Affiliation: https://cisnet.co.kr
 * License: MIT License
 * ============================================================================
 */

#ifndef IPNAME_CORE_EXPORTS
  #define IPNAME_CORE_EXPORTS
#endif
#include "../include/ipname_core.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#ifdef _WIN32
  #include <winsock2.h>
  #include <windows.h>
  #include <iphlpapi.h>
  #include <icmpapi.h>
  #pragma comment(lib, "ws2_32.lib")
  #pragma comment(lib, "iphlpapi.lib")
#else
  #include <arpa/inet.h>
  #include <sys/time.h>
  #include <unistd.h>
#endif

#define IPNAME_VERSION "1.12.6"

/* Helper: case-insensitive substring search */
static int str_contains_ci(const char* haystack, const char* needle) {
    if (!haystack || !needle) return 0;
    size_t hlen = strlen(haystack);
    size_t nlen = strlen(needle);
    if (nlen == 0) return 1;
    if (hlen < nlen) return 0;
    for (size_t i = 0; i <= hlen - nlen; i++) {
        size_t j = 0;
        while (j < nlen && tolower((unsigned char)haystack[i + j]) == tolower((unsigned char)needle[j])) {
            j++;
        }
        if (j == nlen) return 1;
    }
    return 0;
}

/* Helper: parse IPv4 dotted-decimal string into 32-bit host order integer */
static int parse_ipv4_string(const char* str, uint32_t* out_val) {
    if (!str || !out_val) return 0;
    unsigned int b1, b2, b3, b4;
    char tail;
    if (sscanf(str, "%u.%u.%u.%u%c", &b1, &b2, &b3, &b4, &tail) != 4) {
        return 0;
    }
    if (b1 > 255 || b2 > 255 || b3 > 255 || b4 > 255) {
        return 0;
    }
    *out_val = ((uint32_t)b1 << 24) | ((uint32_t)b2 << 16) | ((uint32_t)b3 << 8) | (uint32_t)b4;
    return 1;
}

/* Helper: format 32-bit host order integer into IPv4 dotted-decimal string */
static void format_ipv4_string(uint32_t val, char* out_buf, size_t buf_len) {
    snprintf(out_buf, buf_len, "%u.%u.%u.%u",
        (val >> 24) & 0xFF,
        (val >> 16) & 0xFF,
        (val >> 8) & 0xFF,
        val & 0xFF
    );
}

/* Helper: count set bits in a 32-bit integer (Hamming weight / CIDR) */
static uint32_t count_set_bits(uint32_t n) {
    uint32_t count = 0;
    while (n) {
        count += (n & 1);
        n >>= 1;
    }
    return count;
}

/* Helper: verify whether a subnet mask has contiguous 1s from MSB */
static int is_contiguous_subnet_mask(uint32_t mask) {
    if (mask == 0) return 1; /* 0.0.0.0 */
    uint32_t inv = ~mask;
    return ((inv & (inv + 1)) == 0);
}

/* ========================================================================= */
/* Exported Implementation                                                   */
/* ========================================================================= */

IPNAME_API IpNameStatus IPNAME_CALL IpName_GetVersion(char* buffer, int max_len) {
    if (!buffer || max_len <= 0) {
        return IPNAME_ERR_INVALID_PARAM;
    }
    if ((size_t)max_len < strlen(IPNAME_VERSION) + 1) {
        return IPNAME_ERR_BUFFER_TOO_SMALL;
    }
    strncpy(buffer, IPNAME_VERSION, max_len - 1);
    buffer[max_len - 1] = '\0';
    return IPNAME_OK;
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_PingIpv4(
    const char* target_ip,
    uint32_t timeout_ms,
    IpNamePingResult* out_result
) {
    if (!target_ip || !out_result) {
        return IPNAME_ERR_INVALID_PARAM;
    }
    if (timeout_ms == 0) {
        timeout_ms = 1000; /* Default 1s */
    }

    uint32_t ip_host_order = 0;
    if (!parse_ipv4_string(target_ip, &ip_host_order)) {
        return IPNAME_ERR_INVALID_PARAM;
    }

#ifdef _WIN32
    /* Native Windows ICMP Echo Implementation using IcmpSendEcho */
    HANDLE hIcmpFile = IcmpCreateFile();
    if (hIcmpFile == INVALID_HANDLE_VALUE) {
        return IPNAME_ERR_SOCKET_INIT;
    }

    /* Convert parsed host-order IP to network-order (avoids deprecated inet_addr) */
    unsigned long ipaddr = htonl(ip_host_order);
    char SendData[] = "IpNameCore Ping Echo Probe";

    /* 64-bit alignment safety: ensure buffer exceeds sizeof(ICMP_ECHO_REPLY) + IO_STATUS_BLOCK */
    DWORD ReplySize = sizeof(ICMP_ECHO_REPLY) + sizeof(SendData) + 64;
    if (ReplySize < 1024) ReplySize = 1024;

    void* ReplyBuffer = malloc(ReplySize);
    if (!ReplyBuffer) {
        IcmpCloseHandle(hIcmpFile);
        return IPNAME_ERR_BUFFER_TOO_SMALL;
    }

    DWORD dwRetVal = IcmpSendEcho(
        hIcmpFile,
        ipaddr,
        SendData,
        (WORD)sizeof(SendData),
        NULL,
        ReplyBuffer,
        ReplySize,
        (DWORD)timeout_ms
    );

    if (dwRetVal != 0) {
        PICMP_ECHO_REPLY pEchoReply = (PICMP_ECHO_REPLY)ReplyBuffer;
        out_result->status_code = pEchoReply->Status;
        out_result->round_trip_time_ms = pEchoReply->RoundTripTime;
        out_result->time_to_live = (uint32_t)pEchoReply->Options.Ttl;
        out_result->bytes_received = (uint32_t)pEchoReply->DataSize;

        free(ReplyBuffer);
        IcmpCloseHandle(hIcmpFile);

        if (pEchoReply->Status == 0) {
            return IPNAME_OK;
        } else if (pEchoReply->Status == 11010) { /* IP_REQ_TIMED_OUT */
            return IPNAME_ERR_TIMEOUT;
        } else {
            return IPNAME_ERR_HOST_UNREACHABLE;
        }
    } else {
        DWORD err = GetLastError();
        free(ReplyBuffer);
        IcmpCloseHandle(hIcmpFile);
        if (err == 11010) {
            return IPNAME_ERR_TIMEOUT;
        }
        return IPNAME_ERR_HOST_UNREACHABLE;
    }
#else
    /* Non-Windows / Emulated Portable Fallback for dev/previews */
    out_result->status_code = 0;
    out_result->round_trip_time_ms = 4;
    out_result->time_to_live = 64;
    out_result->bytes_received = 32;
    return IPNAME_OK;
#endif
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_CalculateSubnet(
    const char* ip_address,
    const char* subnet_mask,
    IpNameSubnetDetails* out_details
) {
    if (!ip_address || !subnet_mask || !out_details) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    uint32_t ip = 0;
    uint32_t mask = 0;

    if (!parse_ipv4_string(ip_address, &ip) || !parse_ipv4_string(subnet_mask, &mask)) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    if (!is_contiguous_subnet_mask(mask)) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    uint32_t wildcard = ~mask;
    uint32_t network = ip & mask;
    uint32_t broadcast = ip | wildcard;

    out_details->cidr_prefix = count_set_bits(mask);

    format_ipv4_string(network, out_details->network_address, sizeof(out_details->network_address));
    format_ipv4_string(broadcast, out_details->broadcast_address, sizeof(out_details->broadcast_address));

    if (wildcard <= 1) {
        /* /31 or /32 point-to-point / host route */
        format_ipv4_string(network, out_details->first_usable_ip, sizeof(out_details->first_usable_ip));
        format_ipv4_string(broadcast, out_details->last_usable_ip, sizeof(out_details->last_usable_ip));
        out_details->usable_hosts = (wildcard == 0) ? 1 : 2;
    } else {
        /* Standard Subnet (/1 ~ /30) */
        uint32_t first_ip = network + 1;
        uint32_t last_ip = broadcast - 1;

        format_ipv4_string(first_ip, out_details->first_usable_ip, sizeof(out_details->first_usable_ip));
        format_ipv4_string(last_ip, out_details->last_usable_ip, sizeof(out_details->last_usable_ip));
        out_details->usable_hosts = wildcard - 1;
    }

    return IPNAME_OK;
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_ValidateNetBiosName(
    const char* name,
    char* out_err_msg,
    int max_err_len
) {
    if (!name) {
        if (out_err_msg && max_err_len > 0) {
            strncpy(out_err_msg, "Name cannot be null", max_err_len - 1);
        }
        return IPNAME_ERR_INVALID_PARAM;
    }

    size_t len = strlen(name);
    if (len == 0) {
        if (out_err_msg && max_err_len > 0) {
            strncpy(out_err_msg, "컴퓨터 이름을 입력해주세요. (빈 문자열 불가)", max_err_len - 1);
        }
        return IPNAME_ERR_INVALID_PARAM;
    }

    if (len > 15) {
        if (out_err_msg && max_err_len > 0) {
            snprintf(out_err_msg, max_err_len, "NetBIOS 컴퓨터 이름은 최대 15자까지만 허용됩니다. (현재 %zu자)", len);
        }
        return IPNAME_ERR_INVALID_PARAM;
    }

    /* Prohibited characters by Windows NetBIOS: \ / : * ? " < > | + = ; : , and spaces */
    const char* prohibited = "\\/:*?\"<>|+=;, ";
    for (size_t i = 0; i < len; i++) {
        char c = name[i];
        if (strchr(prohibited, c) != NULL || ((unsigned char)c < 32 && (unsigned char)c != 0)) {
            if (out_err_msg && max_err_len > 0) {
                snprintf(out_err_msg, max_err_len, "특수문자 '%c'는 컴퓨터 이름에 사용할 수 없습니다.", c);
            }
            return IPNAME_ERR_INVALID_PARAM;
        }
    }

    /* Cannot start or end with a hyphen or dot */
    if (name[0] == '-' || name[0] == '.' || name[len - 1] == '-' || name[len - 1] == '.') {
        if (out_err_msg && max_err_len > 0) {
            strncpy(out_err_msg, "컴퓨터 이름의 시작이나 끝에는 하이픈(-)이나 점(.)을 사용할 수 없습니다.", max_err_len - 1);
        }
        return IPNAME_ERR_INVALID_PARAM;
    }

    if (out_err_msg && max_err_len > 0) {
        out_err_msg[0] = '\0';
    }
    return IPNAME_OK;
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_FormatMac(
    const uint8_t* mac_bytes,
    char delimiter,
    char* out_buffer
) {
    if (!mac_bytes || !out_buffer) {
        return IPNAME_ERR_INVALID_PARAM;
    }
    if (delimiter != ':' && delimiter != '-') {
        delimiter = ':';
    }

    snprintf(out_buffer, 18, "%02X%c%02X%c%02X%c%02X%c%02X%c%02X",
        mac_bytes[0], delimiter,
        mac_bytes[1], delimiter,
        mac_bytes[2], delimiter,
        mac_bytes[3], delimiter,
        mac_bytes[4], delimiter,
        mac_bytes[5]
    );

    return IPNAME_OK;
}

/* ========================================================================= */
/* New Creative Functions: ARP IP Conflict, TCP Port Probe, IP Classification */
/* ========================================================================= */

IPNAME_API IpNameStatus IPNAME_CALL IpName_CheckIpConflictEx(
    const char* target_ip,
    const char* source_ip,
    const char* own_mac,
    IpNameConflictResult* out_result
) {
    if (!target_ip || !out_result) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    memset(out_result, 0, sizeof(IpNameConflictResult));

    uint32_t dest_host_val = 0;
    if (!parse_ipv4_string(target_ip, &dest_host_val)) {
        snprintf(out_result->message, sizeof(out_result->message), "유효하지 않은 IPv4 주소 형식입니다.");
        return IPNAME_ERR_INVALID_PARAM;
    }

#ifdef _WIN32
    IPAddr dest_ip = (IPAddr)htonl(dest_host_val);
    IPAddr src_ip = 0;

    if (source_ip && strlen(source_ip) > 0) {
        uint32_t src_host_val = 0;
        if (parse_ipv4_string(source_ip, &src_host_val)) {
            src_ip = (IPAddr)htonl(src_host_val);
        }
    }

    ULONG mac_addr[2] = {0, 0};
    ULONG mac_addr_len = 6;

    /* Send in-process Layer-2 ARP request to detect conflicting devices */
    DWORD dwRet = SendARP(dest_ip, src_ip, mac_addr, &mac_addr_len);

    if (dwRet == NO_ERROR && mac_addr_len == 6) {
        IpName_FormatMac((const uint8_t*)mac_addr, ':', out_result->conflicting_mac);

        /* Check if the responding MAC is actually the local adapter's own MAC */
        if (own_mac && strlen(own_mac) > 0) {
            char clean_detected[16] = {0};
            char clean_own[16] = {0};
            int di = 0, oi = 0;

            for (int i = 0; out_result->conflicting_mac[i] && di < 15; i++) {
                char c = out_result->conflicting_mac[i];
                if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f')) {
                    clean_detected[di++] = (char)toupper(c);
                }
            }
            for (int i = 0; own_mac[i] && oi < 15; i++) {
                char c = own_mac[i];
                if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'F') || (c >= 'a' && c <= 'f')) {
                    clean_own[oi++] = (char)toupper(c);
                }
            }

            if (di == 12 && oi == 12 && strcmp(clean_detected, clean_own) == 0) {
                /* Same MAC address: The IP belongs to this local adapter! Not an external conflict! */
                out_result->is_conflict = 0;
                snprintf(out_result->message, sizeof(out_result->message),
                    "✓ [현재 어댑터] 해당 IP(%s)는 현재 본인 랜카드(MAC: %s)에 할당된 정상 주소이며, 외부 충돌이 없습니다.",
                    target_ip, out_result->conflicting_mac);
                return IPNAME_OK;
            }
        }

        /* Another host on the LAN answered the ARP request! IP IS IN USE! */
        out_result->is_conflict = 1;
        snprintf(out_result->message, sizeof(out_result->message),
            "⚠️ [IP 충돌 감지] 동일한 IP를 사용하는 외부 기기(MAC: %s)가 발견되었습니다.",
            out_result->conflicting_mac);
        return IPNAME_ERR_IP_CONFLICT;
    } else {
        /* No host answered the ARP probe on the local subnet -> Safe to use! */
        out_result->is_conflict = 0;
        out_result->conflicting_mac[0] = '\0';
        snprintf(out_result->message, sizeof(out_result->message),
            "✓ [사용 가능] 해당 IP(%s)는 로컬 네트워크에서 사용 가능한 안전한 주소입니다.",
            target_ip);
        return IPNAME_OK;
    }
#else
    /* Non-Windows mock for preview environments */
    if (own_mac && (str_contains_ci(own_mac, "AA:BB:CC:11:22:33") || str_contains_ci(own_mac, "18:C0:4D:7F:68:08"))) {
        out_result->is_conflict = 0;
        strncpy(out_result->conflicting_mac, own_mac, sizeof(out_result->conflicting_mac) - 1);
        snprintf(out_result->message, sizeof(out_result->message),
            "✓ [현재 어댑터] 해당 IP(%s)는 현재 본인 랜카드(MAC: %s)에 할당된 정상 주소이며, 외부 충돌이 없습니다.",
            target_ip, out_result->conflicting_mac);
        return IPNAME_OK;
    }

    if (dest_host_val % 256 == 99) {
        out_result->is_conflict = 1;
        strncpy(out_result->conflicting_mac, "AA:BB:CC:11:22:33", sizeof(out_result->conflicting_mac) - 1);
        snprintf(out_result->message, sizeof(out_result->message),
            "⚠️ [IP 충돌 감지] 동일한 IP를 사용하는 외부 기기(MAC: AA:BB:CC:11:22:33)가 발견되었습니다.");
        return IPNAME_ERR_IP_CONFLICT;
    } else {
        out_result->is_conflict = 0;
        snprintf(out_result->message, sizeof(out_result->message),
            "✓ [사용 가능] 해당 IP(%s)는 로컬 네트워크에서 사용 가능한 안전한 주소입니다.",
            target_ip);
        return IPNAME_OK;
    }
#endif
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_CheckIpConflict(
    const char* target_ip,
    const char* source_ip,
    IpNameConflictResult* out_result
) {
    return IpName_CheckIpConflictEx(target_ip, source_ip, NULL, out_result);
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_CheckTcpPort(
    const char* target_ip,
    uint16_t port,
    uint32_t timeout_ms,
    IpNameTcpPortResult* out_result
) {
    if (!target_ip || port == 0 || !out_result) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    memset(out_result, 0, sizeof(IpNameTcpPortResult));
    if (timeout_ms == 0) timeout_ms = 1000;

    uint32_t host_ip = 0;
    if (!parse_ipv4_string(target_ip, &host_ip)) {
        snprintf(out_result->message, sizeof(out_result->message), "유효하지 않은 IPv4 주소입니다.");
        return IPNAME_ERR_INVALID_PARAM;
    }

#ifdef _WIN32
    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (s == INVALID_SOCKET) {
        snprintf(out_result->message, sizeof(out_result->message), "소켓 초기화 실패");
        return IPNAME_ERR_SOCKET_INIT;
    }

    /* Set socket to non-blocking mode */
    u_long mode = 1;
    ioctlsocket(s, FIONBIO, &mode);

    struct sockaddr_in target;
    memset(&target, 0, sizeof(target));
    target.sin_family = AF_INET;
    target.sin_port = htons(port);
    target.sin_addr.s_addr = htonl(host_ip);

    DWORD start_tick = GetTickCount();
    int res = connect(s, (struct sockaddr*)&target, sizeof(target));

    if (res == 0) {
        /* Connected immediately */
        DWORD elapsed = GetTickCount() - start_tick;
        out_result->is_open = 1;
        out_result->latency_ms = elapsed;
        snprintf(out_result->message, sizeof(out_result->message), "포트 %u 연결 성공 (%lu ms)", port, elapsed);
        closesocket(s);
        return IPNAME_OK;
    }

    int err = WSAGetLastError();
    if (err == WSAEWOULDBLOCK) {
        fd_set write_fds, except_fds;
        FD_ZERO(&write_fds);
        FD_ZERO(&except_fds);
        FD_SET(s, &write_fds);
        FD_SET(s, &except_fds);

        struct timeval tv;
        tv.tv_sec = timeout_ms / 1000;
        tv.tv_usec = (timeout_ms % 1000) * 1000;

        int sel_res = select(0, NULL, &write_fds, &except_fds, &tv);
        DWORD elapsed = GetTickCount() - start_tick;

        if (sel_res > 0 && FD_ISSET(s, &write_fds) && !FD_ISSET(s, &except_fds)) {
            out_result->is_open = 1;
            out_result->latency_ms = elapsed;
            snprintf(out_result->message, sizeof(out_result->message), "포트 %u 연결 성공 (%lu ms)", port, elapsed);
            closesocket(s);
            return IPNAME_OK;
        } else {
            out_result->is_open = 0;
            out_result->latency_ms = 0;
            snprintf(out_result->message, sizeof(out_result->message), "포트 %u 연결 불가 또는 타임아웃 (%u ms)", port, timeout_ms);
            closesocket(s);
            return IPNAME_ERR_TIMEOUT;
        }
    } else {
        out_result->is_open = 0;
        snprintf(out_result->message, sizeof(out_result->message), "포트 %u 연결 거부 (WSAError: %d)", port, err);
        closesocket(s);
        return IPNAME_ERR_HOST_UNREACHABLE;
    }
#else
    /* Non-Windows mock */
    out_result->is_open = 1;
    out_result->latency_ms = 8;
    snprintf(out_result->message, sizeof(out_result->message), "포트 %u 연결 성공 (8 ms - IpNameCore 모의)", port);
    return IPNAME_OK;
#endif
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_ClassifyIp(
    const char* ip_address,
    IpNameIpClassification* out_classification
) {
    if (!ip_address || !out_classification) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    memset(out_classification, 0, sizeof(IpNameIpClassification));

    uint32_t val = 0;
    if (!parse_ipv4_string(ip_address, &val)) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    uint8_t o1 = (val >> 24) & 0xFF;
    uint8_t o2 = (val >> 16) & 0xFF;

    if (o1 == 10) {
        strncpy(out_classification->category, "Private (사설 IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1918 Class A (10.0.0.0/8)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 172 && (o2 >= 16 && o2 <= 31)) {
        strncpy(out_classification->category, "Private (사설 IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1918 Class B (172.16.0.0/12)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 192 && o2 == 168) {
        strncpy(out_classification->category, "Private (사설 IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1918 Class C (192.168.0.0/16)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 127) {
        strncpy(out_classification->category, "Loopback (루프백)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1122 Localhost (127.0.0.0/8)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 169 && o2 == 254) {
        strncpy(out_classification->category, "APIPA (자동 사설 IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 3927 Link-Local (169.254.0.0/16)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 100 && (o2 >= 64 && o2 <= 127)) {
        strncpy(out_classification->category, "CGNAT (통신사 공유 IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 6598 Carrier-Grade NAT (100.64.0.0/10)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 >= 224 && o1 <= 239) {
        strncpy(out_classification->category, "Multicast (멀티캐스트)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 5771 Class D (224.0.0.0/4)", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 >= 240) {
        strncpy(out_classification->category, "Reserved (예약 대역)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1700 Class E Reserved", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else if (o1 == 0) {
        strncpy(out_classification->category, "Current Network", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "RFC 1122 'This' Network", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 0;
    } else {
        strncpy(out_classification->category, "Public (공인 WAN IP)", sizeof(out_classification->category) - 1);
        strncpy(out_classification->scope_desc, "Global Internet Routable", sizeof(out_classification->scope_desc) - 1);
        out_classification->is_routable = 1;
    }

    return IPNAME_OK;
}

IPNAME_API IpNameStatus IPNAME_CALL IpName_DistinguishAdapter(
    const char* name,
    const char* desc,
    const char* mac,
    uint32_t if_type,
    uint32_t tunnel_type,
    IpNameAdapterDistinction* out_result
) {
    if (!out_result) {
        return IPNAME_ERR_INVALID_PARAM;
    }

    memset(out_result, 0, sizeof(IpNameAdapterDistinction));

    const char* safe_name = name ? name : "";
    const char* safe_desc = desc ? desc : "";
    const char* safe_mac = mac ? mac : "";

    /* 1. Check for Pseudo, Filter, Loopback, or Kernel Debug remnants */
    if (if_type == 24 /* SOFTWARE_LOOPBACK */ ||
        str_contains_ci(safe_name, "loopback") ||
        str_contains_ci(safe_desc, "loopback") ||
        str_contains_ci(safe_name, "-wfp") ||
        str_contains_ci(safe_name, "-npc") ||
        str_contains_ci(safe_name, "-qos") ||
        str_contains_ci(safe_name, "-virt") ||
        str_contains_ci(safe_name, "커널 디") ||
        str_contains_ci(safe_name, "kernel debug") ||
        str_contains_ci(safe_desc, "kernel debug") ||
        str_contains_ci(safe_desc, "lightweight filter") ||
        str_contains_ci(safe_desc, "native mac layer") ||
        str_contains_ci(safe_desc, "packet scheduler") ||
        str_contains_ci(safe_desc, "kdnic") ||
        str_contains_ci(safe_desc, "npcap") ||
        str_contains_ci(safe_desc, "winpcap") ||
        str_contains_ci(safe_desc, "wan miniport") ||
        str_contains_ci(safe_desc, "teredo") ||
        str_contains_ci(safe_desc, "isatap") ||
        str_contains_ci(safe_desc, "6to4") ||
        str_contains_ci(safe_name, "wi-fi direct") ||
        str_contains_ci(safe_desc, "wi-fi direct") ||
        str_contains_ci(safe_name, "wifi direct") ||
        str_contains_ci(safe_desc, "wifi direct") ||
        str_contains_ci(safe_name, "bluetooth") ||
        str_contains_ci(safe_desc, "bluetooth")) {
        out_result->is_ghost_or_filter = 1;
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Pseudo Filter / Ghost", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Kernel filter driver, pseudo device or loopback", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }

    /* 2. Check NDIS Tunnel Type */
    if (tunnel_type != 0 || if_type == 131 /* IF_TYPE_TUNNEL */ || if_type == 142 /* IF_TYPE_IPHTTPS */) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Tunnel", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "NDIS Tunnel Interface (VPN/Tunnel Type)", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }

    /* 3. Check IEEE Hypervisor MAC OUI Prefixes */
    /* Hyper-V: 00:15:5D */
    if (str_contains_ci(safe_mac, "00:15:5D") || str_contains_ci(safe_mac, "00-15-5D")) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Microsoft Hyper-V Virtual MAC OUI (00:15:5D)", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }
    /* VMware: 00:05:69, 00:0C:29, 00:50:56 */
    if (str_contains_ci(safe_mac, "00:05:69") || str_contains_ci(safe_mac, "00-05-69") ||
        str_contains_ci(safe_mac, "00:0C:29") || str_contains_ci(safe_mac, "00-0C-29") ||
        str_contains_ci(safe_mac, "00:50:56") || str_contains_ci(safe_mac, "00-50-56")) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "VMware Virtual MAC OUI (00:05:69/00:0C:29/00:50:56)", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }
    /* VirtualBox: 08:00:27 */
    if (str_contains_ci(safe_mac, "08:00:27") || str_contains_ci(safe_mac, "08-00-27")) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Oracle VirtualBox MAC OUI (08:00:27)", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }
    /* QEMU / KVM: 52:54:00 */
    if (str_contains_ci(safe_mac, "52:54:00") || str_contains_ci(safe_mac, "52-54-00")) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "QEMU / KVM Virtual MAC OUI (52:54:00)", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }

    /* 4. Comprehensive Keyword & Description Analysis (Korean '가상' & English) */
    if (str_contains_ci(safe_name, "가상") ||
        str_contains_ci(safe_desc, "가상") ||
        str_contains_ci(safe_name, "virtual") ||
        str_contains_ci(safe_desc, "virtual") ||
        str_contains_ci(safe_name, "vethernet") ||
        str_contains_ci(safe_desc, "vethernet") ||
        str_contains_ci(safe_name, "vswitch") ||
        str_contains_ci(safe_desc, "vswitch") ||
        str_contains_ci(safe_name, "hyper-v") ||
        str_contains_ci(safe_desc, "hyper-v") ||
        str_contains_ci(safe_name, "vmware") ||
        str_contains_ci(safe_desc, "vmware") ||
        str_contains_ci(safe_name, "vmnet") ||
        str_contains_ci(safe_desc, "vmnet") ||
        str_contains_ci(safe_name, "virtualbox") ||
        str_contains_ci(safe_desc, "virtualbox") ||
        str_contains_ci(safe_name, "vbox") ||
        str_contains_ci(safe_desc, "vbox") ||
        str_contains_ci(safe_name, "wsl") ||
        str_contains_ci(safe_desc, "wsl") ||
        str_contains_ci(safe_name, "tap") ||
        str_contains_ci(safe_desc, "tap") ||
        str_contains_ci(safe_name, "wintun") ||
        str_contains_ci(safe_desc, "wintun") ||
        str_contains_ci(safe_name, "tailscale") ||
        str_contains_ci(safe_desc, "tailscale") ||
        str_contains_ci(safe_name, "zerotier") ||
        str_contains_ci(safe_desc, "zerotier") ||
        str_contains_ci(safe_name, "openvpn") ||
        str_contains_ci(safe_desc, "openvpn") ||
        str_contains_ci(safe_name, "wireguard") ||
        str_contains_ci(safe_desc, "wireguard") ||
        str_contains_ci(safe_name, "hamachi") ||
        str_contains_ci(safe_desc, "hamachi") ||
        str_contains_ci(safe_name, "radmin") ||
        str_contains_ci(safe_desc, "radmin") ||
        str_contains_ci(safe_name, "anyconnect") ||
        str_contains_ci(safe_desc, "anyconnect") ||
        str_contains_ci(safe_name, "cisco") ||
        str_contains_ci(safe_desc, "cisco") ||
        str_contains_ci(safe_name, "fortinet") ||
        str_contains_ci(safe_desc, "fortinet") ||
        str_contains_ci(safe_name, "globalprotect") ||
        str_contains_ci(safe_desc, "globalprotect") ||
        str_contains_ci(safe_name, "vpn") ||
        str_contains_ci(safe_desc, "vpn") ||
        str_contains_ci(safe_desc, "virtio") ||
        str_contains_ci(safe_desc, "ndis virtual")) {
        out_result->is_virtual = 1;
        strncpy(out_result->category, "Virtual Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Virtual / Software Adapter Signature Matched", sizeof(out_result->detection_reason) - 1);
        return IPNAME_OK;
    }

    /* 5. Physical Adapter Recognition (Wi-Fi vs Ethernet) */
    out_result->is_virtual = 0;
    if (if_type == 71 /* IF_TYPE_IEEE80211 */ ||
        str_contains_ci(safe_name, "wi-fi") ||
        str_contains_ci(safe_desc, "wi-fi") ||
        str_contains_ci(safe_name, "wireless") ||
        str_contains_ci(safe_desc, "wireless") ||
        str_contains_ci(safe_name, "와이파이") ||
        str_contains_ci(safe_desc, "와이파이") ||
        str_contains_ci(safe_name, "무선") ||
        str_contains_ci(safe_desc, "무선")) {
        out_result->is_wifi = 1;
        strncpy(out_result->category, "Physical Wi-Fi", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Physical IEEE 802.11 Wireless LAN Hardware", sizeof(out_result->detection_reason) - 1);
    } else {
        out_result->is_wifi = 0;
        strncpy(out_result->category, "Physical Ethernet", sizeof(out_result->category) - 1);
        strncpy(out_result->detection_reason, "Physical Dedicated Wired Ethernet Hardware NIC", sizeof(out_result->detection_reason) - 1);
    }

    return IPNAME_OK;
}
