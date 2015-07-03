const regions = ["tyo1","sin1","sjc1"];

var apiUserName = "";
var apiPassword = "";

var token = {};

safari.application.addEventListener("popover", popoverHandler, true);

function popoverHandler(event){
    apiUserName = safari.extension.settings.apiUserName;
    apiPassword = safari.extension.settings.apiPassword;

    $('#add-style').remove();
    if (safari.extension.settings.ConohaMode){
         $('head link:last').after('<link id="add-style" rel="stylesheet" href="panel_conoha-mode.css">');
    }else{
        $('body').css("background-color","#FFFFFF");
    }
    showLoading();
    GetAllServers();
};

// 認証エラー画面表示
function showAuthError() {
    $('#js__loader').hide();
    $('#js__error__auth').show();
    $('#js__vm-list').empty().hide();
}

// ローディング画面表示
function showLoading(){
    $('#js__error__auth').hide();
    $('#js__vm-list').empty().hide();
    $('#js__loader').show();
}

// アクセストークン取得
function GetToken(region, onSuccess) {
    token[region] = undefined;

    if (!apiUserName || !apiPassword || apiUserName.length < 5) {
        showAuthError();
        return;
    }

    var tenantId = "gnct" + apiUserName.substring(4);
    $.ajax({
        type:"post",
        url:"https://identity." + region + ".conoha.io/v2.0/tokens",
        data:JSON.stringify({ auth: { passwordCredentials: { username: apiUserName, password: apiPassword }, tenantName: tenantId } }),
        contentType : "application/JSON",
        dataType: "JSON",
        success: function(data){
            var json = JSON.stringify(data)
            token[region] = data.access.token;
            onSuccess();
        },
        error: function(response){
            showAuthError();
        }
    });
}

// サーバー一覧取得
function GetAllServers() {
    regions.forEach(function(region){
        if (token[region]){
            GetServers(region,0);
        }else{
            GetToken(region,function(){
                GetServers(region,0);
            })
        }
    })
}

// サーバー詳細取得
function GetServers(region, retry) {

    if (retry > 2) {
        return;
    }
    $.ajax({
        type:"get",
        url: "https://compute." + region + ".conoha.io/v2/" + token[region].tenant.id + "/servers/detail",
        contentType : "application/JSON",
        headers: {"Accept": "application/json", "X-Auth-Token": token[region].id},
        dataType: "JSON",
        success: function(data){
            vpsList(data,region);
        },
        error: function(response){
            if(response.status == 401){
                GetToken(region, function(){
                    GetServers(region, ++retry);
                });
            }else{
                showAuthError();
            }
        }
    });
}


// VPSリスト表示
function vpsList(data, region){
    $('#js__loader').hide();
    $('#js__vm-list').show();
    $.each(data.servers, function (number, vm) {
        $('#js__vm-list').append(template('tmpl__vm-list', {
            'uuid': vm.id,
            'nameTag': vm.metadata.instance_name_tag,
            'vm_state': vm["OS-EXT-STS:vm_state"],
            'status': GetJpnStatus(vm.status),
            'region': region
        }));
        $('.vps-list__unit[data-uuid="' + vm.id + '"]').show();
        GetConsoleUrl(region, vm.id, "vnc");
        GetConsoleUrl(region, vm.id, "serial");
        SetServerAction(region, vm.id, "restart");
        SetServerAction(region, vm.id, "start");
        SetServerAction(region, vm.id, "stop");
        SetServerAction(region, vm.id, "halt");
    });    
}

// ステータスの日本語表示
function GetJpnStatus(status){
    switch(status){
        case "ACTIVE":
            return "起動中";
        case "REBOOT":
            return "再起動中";
        case "SHUTOFF":
            return "停止中";
    }
    return status;
}

// コンソールURL取得
function GetConsoleUrl(region, uuid, type, retry) {

    if (retry > 2) {
        return;
    }
    $.ajax({
        type:"post",
        url: "https://compute." + region + ".conoha.io/v2/" + token[region].tenant.id + "/servers/" + uuid + "/action",
        headers: {"Accept": "application/json", "X-Auth-Token": token[region].id},
        data: type == 'vnc' ? '{"os-getVNCConsole": {"type": "novnc"}}' : '{"os-getWebConsole": {"type": "serial"}}', 
        contentType : "application/JSON",
        dataType: "JSON",
        success: function(data){
            $('.vps-list__unit[data-uuid="' + uuid + '"] .js__' + type).attr('href', data.console.url);
        },
        error: function(response){
            if(response.status == 401){
                GetToken(region, function(){
                    GetConsoleUrl(region, uuid, type, ++retry);
                });
            }else{
                showAuthError();
            }
        }
    });

}

function SetServerAction(region, uuid, type){
    var cmd = "javascript:DoServerAction('" + region + "','" + uuid + "','" + type + "');";
    $('.vps-list__unit[data-uuid="' + uuid + '"] .js__' + type).attr('href', cmd);
    
    if (!safari.extension.settings.VmControl){
        $('.vps-list__unit[data-uuid="' + uuid + '"] .js__' + type).remove();        
    }
}

//サーバーコマンド送信
function DoServerAction(region, uuid, type, retry){

    var request_cmd = "";
    var action_jpn = "";
    switch(type){
        case 'restart':
            request_cmd = '{ "reboot": { "type": "SOFT" } }';
            action_jpn = "再起動をおこないます。";
            break;
        case 'start':
            request_cmd = '{ "os-start": null }';
            action_jpn = "起動します。";
            break;
        case 'stop':
            request_cmd = '{ "os-stop": null }';
            action_jpn = "停止処理を開始します。";
            break;
        case 'halt':
            request_cmd = '{ "os-stop": {"force_shutdown": true} }';
            action_jpn = "強制終了を開始します。";
            break;
        default:
            return;
    }

    $.ajax({
        type:"post",
        url: "https://compute." + region + ".conoha.io/v2/" + token[region].tenant.id + "/servers/" + uuid + "/action",
        headers: {"Accept": "application/json", "X-Auth-Token": token[region].id},
        data: request_cmd,
        contentType : "application/JSON",
        dataType: "JSON",
        success: function(data){
            //
        },
        error: function(response){
            if(response.status == 202){
                alert(action_jpn);
            }else if(response.status == 401){
                GetToken(region, function(){
                    DoServerAction(region, uuid, type, ++retry);
                });
            }else{
                showAuthError();
            }
        }
    });
}

