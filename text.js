// // simulate a file from a input

// const file = new File(['a'.repeat(1000000)], 'test.txt')

// const chunkSize = 40000
// const url = 'https://httpbin.org/post'

// for (let start = 0; start < file.size; start += chunkSize) {
//   const chunk = file.slice(start, start + chunkSize + 1)
//   const fd = new FormData()
//   fd.set('data', chunk)
  
//   await fetch(url, { method: 'post', body: fd }).then(res => res.text())
// }

// exports.createChunksAndStoreFromS3 = async (req, res) => {
// 	try {
// 		let {id} = req.params;
// 		let fileUrl = await FileTaskModel.findOne({where:{initiate_id: id}});
        
//         // s3_file_url
//         fileUrl = fileUrl?.s3_file_url;
//         console.log("fileUrl", fileUrl);
//         var fileName = "./upload/EveryPointSession_2022_11_09_13_56_06 (2).eparls";
//         var file = Path.basename(fileName);
//         console.log("file", file);
//         const files = new File(['a'.repeat(1000000)], file)
//         const chunkSize = 5 * 1024 * 1024
        
//         const downloadFile =  await axios({
//             fileUrl,
//             method: 'GET',
//             responseType: 'stream'
//         });
//         downloadFile.data.pipe(Fs.createWriteStream(file))

// //chunks
// for (let start = 0; start < files.size; start += chunkSize) {
//   const chunk = files.slice(start, start + chunkSize + 1)
//   const fd = new FormData()
//   fd.set('data', chunk)
  
//   await fetch(fileUrl, { method: 'post', body: fd }).then(res => res.text())
// }

// 	} catch (error) {
//         console.log("error", error);
//         return apiResponse.ErrorResponse(res, error)
// 		}
// }