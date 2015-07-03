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
            'region': region
        }));
        $('.vps-list__unit[data-uuid="' + vm.id + '"]').show();
        GetConsoleUrl(region, vm.id, "vnc");
        GetConsoleUrl(region, vm.id, "serial");
    });    
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

