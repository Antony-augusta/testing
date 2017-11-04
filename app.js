function objValues(obj) {
    var res = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            res.push(obj[i]);
        }
    }
    return res;
}
function groupingitems(items, type, assetslength) {
    var main = [];
    for (var i = 0; i < Object.keys(items).length; i++) {
        if(Object.values){
            var arr = Object.values(items);
        }
        else{
            var arr = objValues(items);
        }
        var maininner = [];
        var groups = {};
        for (var j = 0; j < arr[i].length; j++) {
            var groupName = '';
            if (type == 1) {
                groupName = parseInt(arr[i][j].assetName);
            } else if (type == 2) {
                if (arr[i][j].isasset) {
                    groupName = parseInt(arr[i][j].assetName);
                } else {
                    groupName = parseInt(arr[i][j].debtType) + assetslength;
                }
            }
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(arr[i][j]);
        }
        for (var groupName in groups) {
            var total = 0;
            for (var amount in groups[groupName]) {
                if (type == 1) {
                    total += parseFloat(groups[groupName][amount].assetsEstimation);
                } else if (type == 2 || groups[groupName][amount].isasset) {
                        total += parseFloat(groups[groupName][amount].outstandingLoanValue);
                } else if (type == 2 || !groups[groupName][amount].isasset){
                     total += parseFloat(groups[groupName][amount].debyEstimation);
                }
            }
            maininner.push({
                id: groupName,
                list: groups[groupName],
                total: total
            });
        }
        main.push(maininner);
    }
    return main;
}
