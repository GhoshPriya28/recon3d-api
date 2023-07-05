require('dotenv').config();
const {EVP_BASE_URL_NEW,EVP_API_VERSION,EVP_API_KEY,EVP_API_SECRET} = process.env;
const FINAL_BASE_URL = EVP_BASE_URL_NEW+EVP_API_VERSION
const ENCODED_KEY = EVP_API_KEY+':'+EVP_API_SECRET;
const GENERATED_ENCODED_KEY = 'Basic '+ Buffer.from(ENCODED_KEY, 'utf8').toString('base64');
console.log(GENERATED_ENCODED_KEY);
const axios = require("axios").create({baseURL: FINAL_BASE_URL, headers: {'Authorization': GENERATED_ENCODED_KEY}});
console.log(axios);
exports.makePostRequest = async function (apiEndpoint,requestBody = null,header = null)
{
	console.log(apiEndpoint , requestBody)
	return await axios.post('/'+apiEndpoint, requestBody).then(async function (response) {
    	console.log(response);
    	return await response.data;
  	}).catch(function (error) {

    	return error;
  	});
}

exports.makeMultipartRequest = async function (apiEndpoint,requestBody = null)
{
	console.log(GENERATED_ENCODED_KEY);
	const header = {maxContentLength: Infinity,maxBodyLength: Infinity,headers: {'Content-Type': 'multipart/form-data;boundary=' + requestBody.getBoundary()}}
	console.log('End Point',apiEndpoint, header)
	return await axios.post('/'+apiEndpoint,requestBody,header).then(async function (response) {
    	//console.log('Response from Everypoint',response.data);
    	return await response.data;
  	}).catch(function (error) {
  		console.log(error);
    	return error;
  	});
}

exports.makeGetRequest = async function (apiEndpoint,requestBody = null,header = null)
{
	console.log(apiEndpoint , requestBody)
	return await axios.get('/'+apiEndpoint,requestBody).then(function (response) {
    	console.log(response);
    	return response;
  	}).catch(function (error) {
    	return error;
  	});
}
exports.makeGetRequestNew = async function (apiEndpoint,requestBody = null,header = null)
{

	//console.log(apiEndpoint , requestBody)
	return await axios.get(apiEndpoint,requestBody).then(function (response) {
    	//console.log(response);
    	return response;
  	}).catch(function (error) {
    	return error;
  	});
}

exports.makeMultipartRequestNew = async function (apiEndpoint,requestBody = null)
{
	const header = {maxContentLength: Infinity,maxBodyLength: Infinity,headers: {'Content-Type': 'multipart/form-data;boundary=' + requestBody.getBoundary()}}
	console.log(apiEndpoint, header)
	return await axios.post(apiEndpoint,requestBody,header).then(function (response) {
    	console.log(response.data);
    	return response.data;
  	}).catch(function (error) {
    	return error;
  	});
}