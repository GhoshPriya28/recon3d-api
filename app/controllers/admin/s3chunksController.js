const db = require("../../models");
const { BASE_URL, ADMIN_BASE_URL, PORTAL_BASE_URL, EVP_BASE_URL, EVP_USER_ID, EVP_CUSTOMER_ID, EVP_API_USERNAME, EVP_API_PASSWORD, EVP_API_SRC_TYPE } = process.env;
//const UserModel = db.UserModel;
const { UserModel: UserModel, FileTaskModel: FileTaskModel, EmailTamplateModel: EmailTamplateModel, TermsModel: TermsModel, PrivacyPolicyModel: PrivacyPolicyModel, EmailsupportModel: EmailsupportModel, FaqsModel: FaqsModel, TutorialsModel: TutorialsModel, PreCompleteTaskModel: PreCompleteTaskModel } = db;
const Op = db.Sequelize.Op;
const { body, validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../../helpers/apiResponse");
var cookieParser = require('cookie-parser');
var session = require('express-session');
const bcrypt = require("bcrypt");
// const path = require('url');
const Path = require('path');
const Fs = require('fs');

const flash = require('connect-flash');
const utility = require("../../helpers/utility");
const notificationUtility = require("../../helpers/pushNotification");
var moment = require('moment');
var ffmpeg = require('ffmpeg');
var configFile = require('../../config/configFile');
var imageBasePath = configFile.getBaseUrl();
const { constants } = require("../../helpers/constants");
const mailer = require("../../helpers/mailer");
var Sequelize = db.Sequelize.Sequelize;
// const fs = require('fs');
var rimraf = require("rimraf");
const everypointProcess = require("../../helpers/everypointProcess2");
const axios = require("axios").create({ baseURL: EVP_BASE_URL, headers: { 'Authorization': 'Basic dHljbzp4NWhkOU5mWUh0b3E2Vy80ZnV1NFN6Qlk3YS9TU0hzRQ==' } });
const { v4: uuidv4 } = require('uuid');


// exports.createChunksAndStoreFromS3 = async (req, res) => {
//     try {
//         let { id } = req.params;
//         let fileUrl = await FileTaskModel.findOne({ where: { initiate_id: id } });
       
//         fileUrl = fileUrl?.s3_file_url;
//         console.log("fileUrl", fileUrl);
//         var fileName = "./upload/EveryPointSession_2022_11_09_13_28_54.eparls";
//         var file = Path.basename(fileName);
//         console.log("file", file);

//         // (file, cSize /* cSize should be byte 1024*1 = 1KB */) => {

//         var createChunks = (file, fileName[0], 5 * 1024 * 1024)
//             let startPointer = 0;
//             let endPointer = file.size;
//             let chunks = [];
//             while (startPointer < endPointer) {
//               let newStartPointer = startPointer + cSize;
//               chunks.push(file.slice(startPointer, newStartPointer));
//               startPointer = newStartPointer;
//             }
//             return chunks;  
          

//     } catch (error) {
//         console.log("error", error);
//         return apiResponse.ErrorResponse(res, error)
//     }
// }

exports.createChunksAndStoreFromS3 = async (req, res) => {
    try {
        let { id } = req.params;
        let fileUrl = await FileTaskModel.findOne({ where: { initiate_id: id } });
       
        fileUrl = fileUrl?.s3_file_url;
        console.log("fileUrl", fileUrl);
        var fileName = "./upload/EveryPointSession_2022_11_09_13_28_54.eparls";
        var file = Path.basename(fileName);
        console.log("file", file);

        // chunk create
        const eparlsStream = Fs.createReadStream(fileName);
        console.log("eparlsStream", eparlsStream);
        const stats = Fs.statSync(fileName);

        const fileNames = `./chunks/chunkfile-${uuidv4()}`;

        // let chunArr = [];
        const chunkProcess = await new Promise((resolve, reject) => {
            let bytesRead = 0;
            let countCurrentUploads = 0;

            // Fs.writeFileSync(fileNames, (error) => {
            //     if (error) {
            //         console.log("error", error);
            //     } else {
            //         console.log("created");
            //     }
            // });

            eparlsStream.on("readable", async function () {
                while (true) {
                    await wait(() => countCurrentUploads <= 0, 1000);

                    const chunk = eparlsStream.read(5 * 1024 * 1024);
                    // console.log("chunk", JSON.stringify(chunk));

                    if (!chunk || !chunk.length) {
                        break;
                    }
                    bytesRead += chunk.length;

                    console.log("bytesRead", bytesRead);

                    countCurrentUploads++;

                    await processChunk(chunk);

                    Fs.writeFileSync(fileNames, JSON.stringify(chunk), (error) => {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(`Chunks Stored in ${fileNames} successfully !!`);
                        }
                    });

                    countCurrentUploads--;
                }

                if (bytesRead >= stats.size) {
                    resolve();
                }
            });

            eparlsStream.on("error", function (error) {
                reject(error);
            });
        });

    } catch (error) {
        console.log("error", error);
        return apiResponse.ErrorResponse(res, error)
    }
}

async function processChunk(chunk) {
    console.log("process chunk...");
    await delay(2000);
    console.log("process chunk... done");
}

async function wait(fn, ms) {
    while (!fn()) {
        await delay(ms);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}