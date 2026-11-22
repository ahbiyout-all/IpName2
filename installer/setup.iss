; ======================================================================
; AhBiYout IpName2 - Inno Setup Professional Installer Script
; ======================================================================
; Execution Sequence:
;   1. Force-close running IpName2 instances (taskkill /F /T)
;   2. Detect existing installation & prompt Uninstall / Overwrite / Cancel
;   3. Display MIT License Agreement (wpLicense)
;   4. Install application files, icons & Windows Firewall rules
;   5. Desktop Shortcut checkbox (checked by default on Finish page)
;   6. Launch Application checkbox (checked by default on Finish page)
; - Silent / Unattended Installation Support (/VERYSILENT /SUPPRESSMSGBOXES)
; ======================================================================

#define MyAppName "IpName2"
#define MyAppVersion "1.13.12"
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
DisableWelcomePage=yes
LicenseFile=..\LICENSE
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
CloseApplicationsFilter=*.exe,*.dll
RestartApplications=no
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} v{#MyAppVersion}

[Languages]
Name: "korean"; MessagesFile: "compiler:Languages\Korean.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
korean.CreateDesktopShortcut=바탕화면 바로가기 만들기
english.CreateDesktopShortcut=Create a desktop shortcut

[Files]
; Unpacked Multi-File Individual Installation (No redundant archives/docs)
; Main Executable (prefers postbuild-prepared IpName2.exe, falls back to Cargo binary ipname2.exe)
#ifexist "..\src-tauri\target\release\IpName2.exe"
Source: "..\src-tauri\target\release\IpName2.exe"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
#else
Source: "..\src-tauri\target\release\ipname2.exe"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion
#endif
; Pure Native Custom DLL Engine (evaluated at compile time, NOT install time)
#ifexist "..\bin\ipname_core.dll"
Source: "..\bin\ipname_core.dll"; DestDir: "{app}"; Flags: ignoreversion
#else
  #ifexist "..\native\ipname_core\ipname_core.dll"
Source: "..\native\ipname_core\ipname_core.dll"; DestDir: "{app}"; Flags: ignoreversion
  #endif
#endif
; Application Icons
Source: "..\IpName2.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app-icon.png"; DestDir: "{app}"; Flags: ignoreversion
; Open Source License
#ifexist "..\LICENSE"
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
#endif

[Icons]
Name: "{group}\{#MyAppName} v{#MyAppVersion}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\IpName2.ico"
Name: "{group}\{#MyAppName} 제거"; Filename: "{uninstallexe}"

[UninstallDelete]
Type: files; Name: "{autodesktop}\{#MyAppName} v*.lnk"
Type: files; Name: "{autodesktop}\{#MyAppName}.lnk"

[Run]
; 1. Silently pre-register Windows Firewall Inbound/Outbound Rules (Base Name: IpName2)
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 인바운드 규칙 등록 중..."
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2"" dir=out action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 아웃바운드 규칙 등록 중..."

; 2. Silently pre-register Windows Firewall Inbound/Outbound Rules (Versioned Name: IpName2 v{#MyAppVersion})
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2 v{#MyAppVersion}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 버전 인바운드 규칙 등록 중..."
Filename: "netsh.exe"; Parameters: "advfirewall firewall add rule name=""IpName2 v{#MyAppVersion}"" dir=out action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=any"; Flags: runhidden waituntilterminated; StatusMsg: "Windows 방화벽 버전 아웃바운드 규칙 등록 중..."

; 3. Launch Application after installation (shellexec required for UAC elevated executables to prevent CreateProcess 740 error)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent shellexec

[UninstallRun]
; Silently delete registered Windows Firewall Rules on uninstallation
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""IpName2"""; Flags: runhidden waituntilterminated
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""IpName2 v{#MyAppVersion}"""; Flags: runhidden waituntilterminated

[Code]
var
  DesktopShortcutCheck: TNewCheckBox;
  FinishedLayoutAdjusted: Boolean;

// Step 1: Force terminate any running IpName2 application instances before uninstall/install
procedure ForceKillRunningApp();
var
  iKillApp, iKillCargo: Integer;
begin
  Exec('taskkill.exe', '/F /T /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, iKillApp);
  Exec('taskkill.exe', '/F /T /IM ipname2.exe', '', SW_HIDE, ewWaitUntilTerminated, iKillCargo);
  if (iKillApp = 0) or (iKillCargo = 0) then
  begin
    // Allow Windows kernel to release handles on executable and ipname_core.dll
    Sleep(700);
  end;
end;

// Lookup existing installation uninstaller path in 64-bit and 32-bit registry views
function GetUninstallString(): String;
var
  sUninstPath: String;
  sRegKey: String;
begin
  sUninstPath := '';
  sRegKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{#MyAppId}_is1';
  if not RegQueryStringValue(HKLM, sRegKey, 'UninstallString', sUninstPath) then
    if not RegQueryStringValue(HKCU, sRegKey, 'UninstallString', sUninstPath) then
      if IsWin64 then
      begin
        if not RegQueryStringValue(HKLM32, sRegKey, 'UninstallString', sUninstPath) then
          RegQueryStringValue(HKCU32, sRegKey, 'UninstallString', sUninstPath);
      end;
  Result := Trim(RemoveQuotes(sUninstPath));
end;

function InitializeSetup(): Boolean;
var
  sUninstPath: String;
  sPrompt: String;
  iChoice: Integer;
  iResultCode: Integer;
begin
  Result := True;

  // 1. Force terminate running application first
  ForceKillRunningApp();

  // 2. Detect existing installation and ask user to Uninstall / Overwrite / Cancel
  sUninstPath := GetUninstallString();
  if (sUninstPath <> '') and FileExists(sUninstPath) then
  begin
    if WizardSilent then
    begin
      Exec(sUninstPath, '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, iResultCode);
      Sleep(300);
      Result := True;
    end
    else
    begin
      if ActiveLanguage() = 'korean' then
      begin
        sPrompt :=
          '기존 버전의 {#MyAppName}가 이미 설치되어 있습니다.' + #13#10#13#10 +
          '[예(Y)] : 기존 앱을 삭제(제거)한 후 새 버전(v{#MyAppVersion}) 설치' + #13#10 +
          '[아니오(N)] : 기존 설정을 유지하고 새 버전으로 덮어쓰기' + #13#10 +
          '[취소] : 설치 중단';
      end
      else
      begin
        sPrompt :=
          'An existing installation of {#MyAppName} was detected.' + #13#10#13#10 +
          '[Yes] : Uninstall the existing version, then install v{#MyAppVersion}' + #13#10 +
          '[No] : Overwrite the existing installation directly' + #13#10 +
          '[Cancel] : Cancel setup';
      end;

      iChoice := MsgBox(sPrompt, mbConfirmation, MB_YESNOCANCEL);
      if iChoice = IDYES then
      begin
        // Uninstall existing version cleanly before proceeding to License & Install
        Exec(sUninstPath, '/VERYSILENT /NORESTART /SUPPRESSMSGBOXES', '', SW_HIDE, ewWaitUntilTerminated, iResultCode);
        Sleep(300);
        Result := True;
      end
      else if iChoice = IDNO then
      begin
        // Overwrite existing installation directly
        Result := True;
      end
      else
      begin
        // Cancelled by user
        Result := False;
      end;
    end;
  end;
end;

function InitializeUninstall(): Boolean;
begin
  ForceKillRunningApp();
  Result := True;
end;

procedure CreateDesktopShortcut();
var
  sShortcutPath: String;
begin
  sShortcutPath := ExpandConstant('{autodesktop}\{#MyAppName} v{#MyAppVersion}.lnk');
  CreateShellLink(
    sShortcutPath,
    '{#MyAppName} v{#MyAppVersion}',
    ExpandConstant('{app}\{#MyAppExeName}'),
    '',
    ExpandConstant('{app}'),
    ExpandConstant('{app}\IpName2.ico'),
    0,
    SW_SHOWNORMAL
  );
end;

procedure InitializeWizard();
begin
  FinishedLayoutAdjusted := False;
  DesktopShortcutCheck := TNewCheckBox.Create(WizardForm);
  DesktopShortcutCheck.Parent := WizardForm.FinishedPage;
  DesktopShortcutCheck.Caption := ExpandConstant('{cm:CreateDesktopShortcut}');
  DesktopShortcutCheck.Checked := True;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  // 5. Show Desktop Shortcut checkbox above Launch Program checkbox on Finish page
  if (CurPageID = wpFinished) and (not FinishedLayoutAdjusted) then
  begin
    FinishedLayoutAdjusted := True;
    DesktopShortcutCheck.Left := WizardForm.RunList.Left + ScaleX(4);
    DesktopShortcutCheck.Top := WizardForm.RunList.Top;
    DesktopShortcutCheck.Width := WizardForm.RunList.Width;
    DesktopShortcutCheck.Height := ScaleY(20);
    WizardForm.RunList.Top := DesktopShortcutCheck.Top + DesktopShortcutCheck.Height + ScaleY(6);
    if WizardForm.RunList.Height > ScaleY(28) then
      WizardForm.RunList.Height := WizardForm.RunList.Height - ScaleY(26);
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = wpFinished then
  begin
    if DesktopShortcutCheck.Checked then
    begin
      CreateDesktopShortcut();
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if WizardSilent then
    begin
      CreateDesktopShortcut();
    end;
  end;
end;

