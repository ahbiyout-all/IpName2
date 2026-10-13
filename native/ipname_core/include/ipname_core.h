/**
 * ============================================================================
 * IpNameCore Native Dynamic Link Library (ipname_core.dll)
 * 
 * Project: AhBiYout IpName2
 * Author: AhBiYout (GitHub: https://github.com/AhBiYout-all)
 * Official Blog: https://ahbiyoutvibe.blogspot.com/
 * Affiliation: https://cisnet.co.kr
 * License: MIT License
 * ============================================================================
 * 
 * This header defines the C-ABI export interface for the pure custom
 * high-performance network diagnostic & subnet calculation engine.
 */

#ifndef IPNAME_CORE_H
#define IPNAME_CORE_H

#include <stdint.h>
#include <stddef.h>

#ifdef _WIN32
  #ifdef IPNAME_CORE_EXPORTS
    #define IPNAME_API __declspec(dllexport)
  #else
    #define IPNAME_API __declspec(dllimport)
  #endif
  #define IPNAME_CALL __stdcall
#else
  #define IPNAME_API __attribute__((visibility("default")))
  #define IPNAME_CALL
#endif

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Result codes returned by IpNameCore DLL functions.
 */
typedef enum {
    IPNAME_OK = 0,
    IPNAME_ERR_INVALID_PARAM = 1,
    IPNAME_ERR_BUFFER_TOO_SMALL = 2,
    IPNAME_ERR_SOCKET_INIT = 3,
    IPNAME_ERR_TIMEOUT = 4,
    IPNAME_ERR_HOST_UNREACHABLE = 5,
    IPNAME_ERR_ACCESS_DENIED = 6,
    IPNAME_ERR_IP_CONFLICT = 7,
    IPNAME_ERR_ARP_FAILED = 8,
    IPNAME_ERR_UNKNOWN = 99
} IpNameStatus;

/**
 * Ping diagnostic result structure
 */
typedef struct {
    uint32_t round_trip_time_ms;
    uint32_t time_to_live;
    uint32_t bytes_received;
    uint32_t status_code;
} IpNamePingResult;

/**
 * Subnet calculation result structure
 */
typedef struct {
    char network_address[16];   /* e.g., "192.168.1.0" */
    char broadcast_address[16]; /* e.g., "192.168.1.255" */
    char first_usable_ip[16];   /* e.g., "192.168.1.1" */
    char last_usable_ip[16];    /* e.g., "192.168.1.254" */
    uint32_t usable_hosts;      /* e.g., 254 */
    uint32_t cidr_prefix;       /* e.g., 24 */
} IpNameSubnetDetails;

/**
 * IP Conflict check result structure via in-process Layer-2 ARP
 */
typedef struct {
    uint32_t is_conflict;       /* 1 = IP is in use by another host (Conflict!), 0 = IP is free */
    char conflicting_mac[18];   /* MAC address of conflicting host e.g. "AA:BB:CC:DD:EE:FF" */
    char message[128];          /* Status message in Korean/English */
} IpNameConflictResult;

/**
 * TCP Port connectivity check result structure
 */
typedef struct {
    uint32_t is_open;           /* 1 = Port is open and reachable, 0 = closed or timed out */
    uint32_t latency_ms;        /* TCP 3-way handshake roundtrip latency */
    char message[128];          /* Diagnostic explanation */
} IpNameTcpPortResult;

/**
 * IP address classification and scope structure
 */
typedef struct {
    char category[32];          /* "Private", "Public", "Loopback", "APIPA", "CGNAT", etc. */
    char scope_desc[64];        /* Detailed RFC specification description */
    uint32_t is_routable;       /* 1 = Routable on global internet, 0 = Local/Non-routable */
} IpNameIpClassification;

/* ========================================================================= */
/* Exported Function Declarations                                            */
/* ========================================================================= */

/**
 * Retrieves the version string of the IpNameCore DLL.
 * @param buffer Output buffer for the version string (e.g., "1.9.0")
 * @param max_len Size of buffer in bytes
 * @return IPNAME_OK on success, or error code
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_GetVersion(char* buffer, int max_len);

/**
 * Performs high-speed in-process ICMP echo ping to an IPv4 destination.
 * Eliminates cmd.exe / ping.exe process invocation overhead.
 * 
 * @param target_ip IPv4 destination string (e.g., "8.8.8.8" or "192.168.1.1")
 * @param timeout_ms Timeout in milliseconds (e.g., 1000)
 * @param out_result Pointer to IpNamePingResult structure to receive metrics
 * @return IPNAME_OK on success, IPNAME_ERR_TIMEOUT on timeout, or error code
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_PingIpv4(
    const char* target_ip,
    uint32_t timeout_ms,
    IpNamePingResult* out_result
);

/**
 * Calculates complete IPv4 subnet details (network, broadcast, usable range, CIDR)
 * using microsecond bitwise arithmetic.
 * 
 * @param ip_address IPv4 address string (e.g., "192.168.1.100")
 * @param subnet_mask Subnet mask string (e.g., "255.255.255.0")
 * @param out_details Pointer to receive calculated IpNameSubnetDetails
 * @return IPNAME_OK on success, or error code
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_CalculateSubnet(
    const char* ip_address,
    const char* subnet_mask,
    IpNameSubnetDetails* out_details
);

/**
 * Validates a Windows computer name or workgroup string against NetBIOS
 * and RFC 1123 standards.
 * 
 * @param name String to validate
 * @param out_err_msg Buffer to receive human-readable error explanation if invalid
 * @param max_err_len Size of error message buffer
 * @return IPNAME_OK if valid, IPNAME_ERR_INVALID_PARAM if invalid
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_ValidateNetBiosName(
    const char* name,
    char* out_err_msg,
    int max_err_len
);

/**
 * Rapidly formats binary MAC address bytes into a standard delimited string.
 * @param mac_bytes 6 bytes of physical MAC address
 * @param delimiter Delimiter character (':' or '-')
 * @param out_buffer Output buffer (minimum 18 bytes)
 * @return IPNAME_OK on success
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_FormatMac(
    const uint8_t* mac_bytes,
    char delimiter,
    char* out_buffer
);

/**
 * Checks for IP address conflicts on the local network segment using in-process
 * Layer-2 SendARP query.
 * 
 * @param target_ip The IPv4 address to test for conflicts (e.g. "192.168.1.100")
 * @param source_ip Optional local source IP (can be NULL for default)
 * @param out_result Pointer to receive conflict detection outcome
 * @return IPNAME_OK on successful probe, or error code
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_CheckIpConflict(
    const char* target_ip,
    const char* source_ip,
    IpNameConflictResult* out_result
);

/**
 * High-speed TCP port connectivity and handshake latency probe.
 * Useful for validating DNS (port 53), HTTP (port 80), HTTPS (port 443), etc.
 * 
 * @param target_ip Destination IPv4 address
 * @param port Target TCP port number (1-65535)
 * @param timeout_ms Connection timeout in milliseconds
 * @param out_result Pointer to receive port status and latency
 * @return IPNAME_OK on success, or error code
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_CheckTcpPort(
    const char* target_ip,
    uint16_t port,
    uint32_t timeout_ms,
    IpNameTcpPortResult* out_result
);

/**
 * Classifies an IPv4 address according to IETF RFC standards
 * (RFC 1918 Private, Loopback, APIPA, CGNAT, Multicast, or Public Internet).
 * 
 * @param ip_address IPv4 address string to classify
 * @param out_classification Pointer to receive classification metadata
 * @return IPNAME_OK on success, or IPNAME_ERR_INVALID_PARAM on invalid format
 */
IPNAME_API IpNameStatus IPNAME_CALL IpName_ClassifyIp(
    const char* ip_address,
    IpNameIpClassification* out_classification
);

#ifdef __cplusplus
}
#endif

#endif /* IPNAME_CORE_H */
