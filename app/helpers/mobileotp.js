const http = require("https");

const options = {
	"method": "",
	"hostname": "",
	"port": ,
	"path": "",
	"headers": {
		"x-rapidapi-host": "",
		"x-rapidapi-key": "",
		"useQueryString": 
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
