; ======================================================================
; AhBiYout IpName2 - Inno Setup Professional Installer Script
; ======================================================================
; - Unpacked Multi-File Individual Installation
; - Silent / Unattended Installation Support (/VERYSILENT /SUPPRESSMSGBOXES)
; - Existing Installation Detection (Prompt to Uninstall/Overwrite)
; - Windows Firewall Silent Pre-Registration (Base Name & Versioned Name)
; ======================================================================

#define MyAppName "IpName2"
#define MyAppVersion "1.10.0"
#define MyAppPublisher "AhBiYout"
#define MyAppURL "https://github.com/AhBiYout-all/IpName2"
#define MyAppBlogURL "https://ahbiyoutvibe.blogspot.com/"
#define MyAppExeName "IpName2.exe"
#define MyAppId "{{42CD47A3-E248-4866-B615-90BC4296A253}"

[Setup]
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppBlogURL}
AppUpdatesURL={#MyAppURL}/releases
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
DisableDirPage=auto
OutputDir=..\dist-installer
OutputBaseFilename=IpName2_v{#MyAppVersion}_Setup
SetupIconFile=..\IpName2.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
RestartApplications=no
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} v{#MyAppVersion}

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Unpacked Multi-File Individual Installation (No redundant archives/docs)
; Main Executable
Source: "..\src-tauri\target\release\IpName2.exe"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
; Pure Native Custom DLL Engine
Source: "..\bin\ipname_core.dll"; DestDir: "{app}"; Flags: ignoreversion; Check: FileExists(ExpandConstant('{src}\..\bin\ipname_core.dll'))
Source: "..\native\ipname_core\ipname_core.dll"; DestDir: "{app}"; Flags: ignoreversion; Check: FileExists(ExpandConstant('{src}\..\native\ipname_core\ipname_core.dll'))
; Application Icons
Source: "..\IpName2.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app-icon.png"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName} v{#MyAppVersion}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\IpName2.ico"
Name: "{group}\{#MyAppName} 제거"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName} v{#MyAppVersion}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\IpName2.ico"; Tasks: desktopicon

[Run]
; 1. Silently pre-register Windows Firewall Inbound/Outbound Rules (Base Name: IpName2)
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 인바운드 규칙 등록 중..."
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2"" dir=out action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 아웃바운드 규칙 등록 중..."

; 2. Silently pre-register Windows Firewall Inbound/Outbound Rules (Versioned Name: IpName2 v1.10.0)
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2 v{#MyAppVersion}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 버전 인바운드 규칙 등록 중..."
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2 v{#MyAppVersion}"" dir=out action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 버전 아웃바운드 규칙 등록 중..."

; Optional Launch after installation
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Silently delete registered Windows Firewall Rules on uninstallation
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""IpName2"""; Flags: runhidden
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""IpName2 v{#MyAppVersion}"""; Flags: runhidden

[Code]
// Detect existing installation and prompt user to overwrite/uninstall
function GetUninstallString(): String;
var
  sUninstPath: String;
begin
  sUninstPath := '';
  if not RegQueryStringValue(HKLM, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppId}_is1', 'UninstallString', sUninstPath) then
    RegQueryStringValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppId}_is1', 'UninstallString', sUninstPath);
  Result := sUninstPath;
end;

function InitializeSetup(): Boolean;
var
  sUninstPath: String;
  iResultCode: Integer;
begin
  Result := True;
  sUninstPath := GetUninstallString();
  if sUninstPath <> '' then
  begin
    sUninstPath := RemoveQuotes(sUninstPath);
    // If running in silent / unattended mode, automatically proceed with overwrite
    if WizardSilent then
    begin
      Exec(sUninstPath, '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, iResultCode);
      Result := True;
    end
    else
    begin
      // Ask user whether to remove/overwrite existing installation
      if MsgBox('기존 버전의 {#MyAppName}가 이미 설치되어 있습니다.' + #13#10#13#10 +
                '기존 버전을 자동으로 정리하고 최신 버전(v{#MyAppVersion})으로 덮어쓰시겠습니까?',
                mbConfirmation, MB_YESNO) = IDYES then
      begin
        Exec(sUninstPath, '/VERYSILENT /NORESTART', '', SW_SHOW, ewWaitUntilTerminated, iResultCode);
        Result := True;
      end
      else
      begin
        // User cancelled overwrite
        Result := False;
      end;
    end;
  end;
end;
