const http = require("https");

const options = {
	"method": "POST",
	"hostname": "smsapi-com3.p.rapidapi.com",
	"port": null,
	"path": "/sms.do?access_token=undefined",
	"headers": {
		"x-rapidapi-host": "smsapi-com3.p.rapidapi.com",
		"x-rapidapi-key": "fa40a27b61msh113fd5fa1eaa3a4p1851f9jsnbe60ab93e4fa",
		"useQueryString": true
	}
};

exports.send = function (from, to, subject, html)
{
const req = http.request(options, function (res) {
	const chunks = [];

	res.on("data", function (chunk) {
		chunks.push(chunk);
	});

	res.on("end", function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});
req.end();
};