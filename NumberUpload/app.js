/**
 * Created by Rajinda on 8/3/2015.
 */


var xlsx2json = require("xlsx2json");
var logger = require('DVP-Common/LogHandler/CommonLogHandler.js').logger;
var DbConn = require('DVP-DBModels');
var messageFormatter = require('DVP-Common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var readline = require('readline');

var rl = readline.createInterface(process.stdin, process.stdout);
var filePath = "";
var dataStartingRow = "";
console.log('Press "exit" to exit or d to start debugging');
rl.prompt();
var request = require('request');
var http = require('http');
http.post = require('http-post');

rl.on('line', function (line) {

try {
    if (line == "exit") {

    }
    else if (line == "u") {

        rl.question("\n Enter File Path \n", function (path) {

            console.log(path);
            filePath = path;
            rl.question("\n Enter data Starting Row \n", function (row) {
                console.log(row);
                dataStartingRow = row;
                rl.question("\n Enter campaignId \n", function (camId) {
                    console.log(camId);
                    rl.question("\n Enter camScheduleId \n", function (camsId) {
                        console.log(camsId);
                        rl.question("\n Enter tenantId \n", function (tenantId) {
                            console.log(tenantId);
                            rl.question("\n Enter companyId \n", function (companyId) {
                                console.log(companyId);
                                rl.question("\n Enter categoryID \n", function (categoryID) {
                                    console.log(categoryID);
                                    ReadFile(filePath, row, camId, camsId, tenantId, companyId, categoryID)
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    else {
        switch (argsNum) {
            case 1:
                //console.log('\n Enter Application ID \n');
                //rl.prompt();
                AppID = line;
                console.log("App Id is : " + AppID);
                argsNum++;
                console.log('\n Enter Caller-Direction : ');
                rl.prompt();
                break;
        }
    }
}
catch (ex) {
    console.log("Error");
    logger.error('[DVP-campaignmanager] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
}
}).on('close', function () {
    logger.debug('[DVP-HTTPProgrammingAPIDEBUG] - [%s] - [READLINE] - Read line closed ', reqIdX);
    process.exit(0);
});




function ReadFile(path, row,campaignId, camScheduleId, tenantId, companyId, categoryID) {
    try{
        console.log("Strat........................");




    xlsx2json(
        path,
        {
            dataStartingRow: row,
            mapping: {
                "No": "A"
            }
        }).done(function (jsonArray) {

            console.log(jsonArray);
            console.log(jsonArray.length);

            var jsonData = [];
            for (var i = 0, length = jsonArray.length; i < length; i++) {
                //console.log(jsonArray[i].No)
                jsonData.push('"'+jsonArray[i].No+'"');
            }

            console.log(jsonData);
            console.log("-------------------------Post--------------------------------");
            var data = '{"CampaignId":"'+campaignId+'","CamScheduleId":"'+camScheduleId+'","CategoryID":"'+categoryID+'","Contacts":['+jsonData+']}';
            console.log(data);
           /* http.post('http://localhost:2222/DVP/API/6.0/CampaignManager/Campaign/Numbers', data, function(res){
                console.log(res);
            });
*/

            //Lets configure and request
            request({
                url: 'http://localhost:2222/DVP/API/6.0/CampaignManager/Campaign/Numbers', //URL to hit
                qs: {from: 'blog example', time: +new Date()}, //Query string data
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Custom-Header': 'Custom Value'
                },
                body: data //Set the body as a string
            }, function(error, response, body){
                if(error) {
                    console.log(error);
                } else {
                    console.log(response.statusCode, body);
                    console.log("-------------------------Post-Done--------------------------------");
                }
            });
            //UploadContactsToCampaignWithSchedule(jsonData, campaignId, camScheduleId, tenantId, companyId, categoryID);
        });}
    catch (ex) {
        console.log("Error");
        logger.error('[DVP-campaignmanager] - [HTTP]  - Exception occurred -  Data - %s ', "authorization", ex);
    }
}


function UploadContactsToCampaignWithSchedule(contacts, campaignId, camScheduleId, tenantId, companyId, categoryID) {

    var ids = [];
    var j = 0;
    for (var i = 0; i < contacts.length; i++) {

        DbConn.CampContactInfo
            .create(
            {
                ContactId: contacts[i],
                Status: true,
                TenantId: tenantId,
                CompanyId: companyId,
                CategoryID: categoryID
            }
        ).complete(function (err, cmp) {
                j++;
                if (err) {

                    logger.error('[DVP-CampContactInfo.UploadContactsToCampaignWithSchedule] - [%s] - [PGSQL] - insertion[CampContactInfo]  failed- [%s]', contacts[j - 1], err);
                    ids.push(contacts[j - 1]);
                }
                else {
                    logger.info('[DVP-CampContactInfo.UploadContactsToCampaignWithSchedule] - [%s] - [PGSQL] - inserted[CampContactInfo] successfully ', contacts[j - 1]);

                    DbConn.CampContactSchedule
                        .create(
                        {
                            CampaignId: campaignId,
                            CamContactId: cmp.CamContactId,
                            CamScheduleId: camScheduleId
                        }
                    ).complete(function (err, cmp) {

                            if (err) {

                                logger.error('[DVP-CampContactInfo.UploadContactsToCampaignWithSchedule] - [%s] - [PGSQL] - insertion[CampContactSchedule]  failed- [%s]', contacts[j - 1], err);
                                ids.push(contacts[j - 1]);
                            }
                            else {
                                logger.info('[DVP-CampaignNumberUpload.UploadContactsToCampaignWithSchedule] - [%s] - [PGSQL] - inserted[CampContactSchedule] successfully ', contacts[j - 1]);
                            }

                        });
                }

                if (j >= contacts.length) {
                    var msg = undefined;
                    if (ids.length > 0) {
                        msg = new Error("Validation Error");
                    }
                    var jsonString = messageFormatter.FormatMessage(msg, "OPERATIONS COMPLETED", ids.length == 0, ids);
                    console.log("jsonString");
                }
            });

    }

}
