require('dotenv').config();
const { BASE_URL } = process.env;
module.exports={
    baseUrl : BASE_URL,
    setBaseUrl : function(url){
      this.baseUrl = url;
    },
    getBaseUrl : function(){
      return this.baseUrl;
    }
}