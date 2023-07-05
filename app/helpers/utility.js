exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};

exports.roleMaster = function (role_id) {
	var myArray={
		1: 'Buyer', 
		2: 'Seller', 
		3: 'Financiars'
	}
	
	return myArray[role_id];
};
exports.accountTypeMaster = function (account_type) {
	var myArray={
		1: 'Individual', 
		2: 'Company'
	}
	return myArray[account_type];
};
exports.INVIDMaster = function (inv_id) {

	var databasevalue = inv_id; 
	// coerce the previous variable as a number and add 1
	var incrementvalue = (+databasevalue) + 1;
	// insert leading zeroes with a negative slice
	incrementvalue = ("00000" + incrementvalue).slice(-5); 
	return incrementvalue;
};


exports.formatDateYMD=function(date) {
    return date = date.split("/").reverse().join("-");
}

exports.formatDateDMY=function(date) {
    return date = date.split("-").reverse().join("/");
}

exports.userListWithkey=function(data) {
	let invoiceListAr=data.map((r) => {
		return r.dataValues;
	});
   // return date = date.split("-").reverse().join("/");
}

exports.checkUserLogin=function(req,res){
   
    if(req.session.name){
		
     return 1;
      
    }else{
		

        res.redirect('/login');
		return 0;
    }
}

exports.generatePassword = function()
{
	var randomstring = Math.random().toString(36).slice(-8);
	return randomstring;
}

exports.sortArray = function(a, b)
{
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;

	var aA = a.replace(reA, "");
	var bA = b.replace(reA, "");
	if (aA === bA) {
		var aN = parseInt(a.replace(reN, ""), 10);
		var bN = parseInt(b.replace(reN, ""), 10);
		return aN === bN ? 0 : aN > bN ? 1 : -1;
	} else {
		return aA > bA ? 1 : -1;
	}
}

exports.excludeArrayOld = function(array, elem) {
    var index = array.indexOf(elem);
    if (index > -1) {
        array.splice(index, 1);
    }
	return array;
}


exports.excludeArray = function(array, elem1,elem2=null) {
    var index = array.indexOf(elem1);
	
    if (index > -1) {
        array.splice(index, 1);
    }
	if(elem2)
	{
		var index1 = array.indexOf(elem2);
		if (index1 > -1) {
			array.splice(index1, 1);
		}
	}
	return array;
}