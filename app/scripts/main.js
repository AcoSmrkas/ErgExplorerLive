var qrCode = null;
var networkType = 'mainnet';
var addresses = new Array();
var addressbook = new Array();

setupMainnetTestnet();

$.ajaxSetup({
    cache: false
});

$(function() {
	if (IS_DEV_ENVIRONMENT) {
		ERGEXPLORER_API_HOST = 'https://localhost/ergexplorer-api/'
	}

	if (window.location.host == 'dev.ergexplorer.com') {
		ERGEXPLORER_API_HOST = 'https://devapi.ergexplorer.com/';
	}
});

window.addEventListener('hashchange', () => {
		if (IS_DEV_ENVIRONMENT) {
			window.location.reload();
		}
	}, false
);

function setDocumentTitle(text) {
	document.title = 'Erg Explorer - ' + text;
}

function setErgLogoImageColor(elementId, width) {
	// Get references to the canvas and its context
	const canvas = document.getElementById(elementId);
	const ctx = canvas.getContext('2d');

	// Load the image
	const img = new Image();
	img.src = '/images/logo-white.png'; // Replace with your image URL
	img.onload = () => {
	    // Set canvas size to match the image dimensions
	    canvas.width = width;
	    canvas.height = width;
	    
	    // Draw the image on the canvas
	    ctx.drawImage(img, 0, 0, width, width);
	    
	    // Get the image data
	    const imageData = ctx.getImageData(0, 0, img.width, img.height);
	    const data = imageData.data;
	    
	    // Define the hex color to replace white
	    // Get the computed styles of an element (can be any element, even hidden)
		const rootStyles = getComputedStyle(document.documentElement);

		// Get the value of the global CSS variable
		const primaryColor = rootStyles.getPropertyValue('--main-color').trim();

	    const hexColor = primaryColor; // Replace with the desired hex color
	    
	    // Loop through the image data and replace white pixels with the new color
	    for (let i = 0; i < data.length; i += 4) {
	        const red = data[i];
	        const green = data[i + 1];
	        const blue = data[i + 2];
	        const alpha = data[i + 3];
	        
	        // Check if the pixel is white (255, 255, 255)
	        if (alpha > 0) {
	            data[i] = parseInt(hexColor.slice(1, 3), 16);
	            data[i + 1] = parseInt(hexColor.slice(3, 5), 16);
	            data[i + 2] = parseInt(hexColor.slice(5, 7), 16);
	        }
	    }
	    
	    // Put the modified image data back on the canvas
	    ctx.putImageData(imageData, 0, 0);
	};
}

function getWalletAddressFromUrl() {
	let addressFromUrl = undefined;

	if (Object.keys(params)[0] = params[Object.keys(params)[0]]) {
		addressFromUrl = Object.keys(params)[0];
	}

	return addressFromUrl;
}

function getWalletAddressUrl(address) {
	return getSearchQueryPage('addresses', address);
}

function goToWalletAddressUrl(address) {
    window.location.assign(getWalletAddressUrl(address));
}

function getTransactionsUrl(txId) {
	return getSearchQueryPage('transactions', txId);
}

function goToTransactionUrl(txId) {
    window.location.assign(getSearchQueryPage('transactions', txId));
}

function getBoxUrl(txId) {
	return getSearchQueryPage('boxes', txId);
}

function goToBoxUrl(txId) {
    window.location.assign(getSearchQueryPage('boxes', txId));
}

function getBlockUrl(blockId) {
	return getSearchQueryPage('blocks', blockId);
}

function goToBlockUrl(blockId) {
    window.location.assign(getBlockUrl(blockId));
}

function getTokenUrl(tokenId) {
	return getSearchQueryPage('token', tokenId);
}

function goToTokenUrl(tokenId) {
    window.location.assign(getSearchQueryPage('token', tokenId));
}

function getIssuedTokensSearchUrl(query) {
	if (query.trim() == '') {
		delete(params['query']);
	} else {
		params['query'] = query;
	}

	delete(params['offset']);
	delete(params['limit']);

	let url = getUrlWithParams('issued-tokens', false);

	return url;
}

function goToIssuedTokensSearch(query) {
	window.location.assign(getIssuedTokensSearchUrl(query));
}

//Search box
function submitSearch(key) {
	if (key.keyCode != 13) return;

	searchAddress();
}

function getSearchQueryPage(page, query) {
	let newPage = '';

	if (IS_DEV_ENVIRONMENT) {
		newPage = '/' + page + '#' + query;
	} else {
		newPage = '/' + page + '/' + query;
	}

	return newPage;
}

function searchAddress() {
	let searchQuery = $('#searchInput').val().trim();
	let searchType = $('#searchType').val();

	if (searchType != '2' && searchQuery == '') return;

	switch (searchType) {
		case '0':
			goToWalletAddressUrl(searchQuery);
			break;
		case '1':
			goToTransactionUrl(searchQuery);
			break;
		case '2':
			if (searchQuery.length == 64) {
				goToTokenUrl(searchQuery);
			} else {
				goToIssuedTokensSearch(searchQuery);
			}
			break;
		case '3':
			goToBlockUrl(searchQuery);
			break;
		case '4':
			goToBoxUrl(searchQuery);
			break;

		default:
			break;
	}
}

//Format strings
function formatErgValueString(value, maxDecimals = 4) {
    let ergValue = value / 1000000000;

    maxDecimals = getDecimals(ergValue, 1);

    if (ergValue > 10 || ergValue < -10) {
            maxDecimals = 2;
    }

    let minimumFractionDigits = 2;
    if (maxDecimals < minimumFractionDigits) {
            minimumFractionDigits= maxDecimals;
    }

	return '<strong title="' + ergValue + '"><span class="text-white">' + ergValue.toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: minimumFractionDigits }) + '</span></strong> ERG';
}

function formatTimeString(dateString, seconds) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + (seconds ? ':' + zeroPad(date.getSeconds(), 2) : '');
}

function formatDateString(dateString) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + ':' + zeroPad(date.getSeconds(), 2) + ', ' + date.toLocaleDateString(getLang());
}

function getLang() {
	if (navigator.languages != undefined) {
		return navigator.languages[0];
	}
	
	return 'en-GB';
}

function formatKbSizeString(size) {
	return (size / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' kB';
}

function formatAddressString(address, length = 15) {
	return address.substring(0, length) + '...' + address.substring(address.length - 4);
}

function formatHashRateString(value) {
	return (value / 1000000000000).toLocaleString('en-US') + ' TH/s'
}

function formatValue(value, digits, autodigits = false) {
	if (autodigits) {
		digits = getAutoDigits(value, digits);
	}

	return '<span title="' + value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 2 }) + '">' + nFormatter(value, digits) + '</span>';
}

function getAutoDigits(value, digits = 2, additionalDigits = 2) {
	let temp = value.toString().split('.');
	if (temp.length > 1) {
		let realSmall = temp[1].split('-');
		if (realSmall.length > 1) {
			digits = parseInt(realSmall[1]) + 1;
		} else {
			for (let j = 0; j < temp[1].length; j++) {
				if (temp[1][j] != '0' && j > 1) {
					digits = j + additionalDigits;

					if ((j + 1) < temp[1].length && temp[1][j] != '0') {
						digits = j + additionalDigits + 1;
					}

					break;
				}
			}
		}
	}

	return digits;
}

function formatAssetValueString(value, decimals, digits = 2) {
	let assetValue = getAssetValue(value, decimals);

	if (assetValue > 0.1) {
		digits = 2;
	}

	digits = getDecimals(assetValue, 1);

	return formatValue(assetValue, digits);
}

function formatAssetNameAndValueString(name, valueString, tokenId) {
	return '<p><strong>' + name + '</strong>: <span class="text-white">' + valueString + '</span></p>';
}

function formatAssetDollarPriceString(tokenAmount, tokenDecimals, tokenId) {
	if (gotPrices == undefined || !gotPrices) {
		return '';
	}

	return formatDollarPriceString(formatAssetDollarPrice(tokenAmount, tokenDecimals, tokenId));
}

function formatDollarPriceString(value, digits = 5) {
	if (gotPrices == undefined || !gotPrices) {
		return '';
	}

	if (value >= 0.1) {
		digits = 2;
	}

	digits = getDecimals(value, 1);

	return '($' + formatValue(value, digits) + ')';
}

function formatAssetDollarPrice(tokenAmount, tokenDecimals, tokenId) {
	if (gotPrices == undefined || !gotPrices || prices[tokenId] == undefined) {
		return -1;
	}

	if (tokenAmount < 0) {
		tokenAmount *= -1;
	}

	return getAssetValue(tokenAmount, tokenDecimals) * prices[tokenId];
}

function formatNftDescription(description) {
	if (description == null) {
		return description;
	}

	if (isJson(description) && isNaN(description)) {
		let jsonObject = JSON.parse(description);
		let result = '';
		result = parseNftJson(jsonObject, result, 0);

		return result;
	} else {
		description = description.replaceAll('\n', '<br>');
		description = description.replaceAll('<br><br>','<br>');

		return description;
	}
}

function parseNftJson(jsonObject, result, indent) {
	let keys = Object.keys(jsonObject);
	let values = Object.values(jsonObject);

	for (let i = 0; i < keys.length; i++) {
		if (typeof values[i] === 'object') {
			result += formatNftDescriptonJson(keys[i], '', indent) + '<br>';
			result = parseNftJson(values[i], result, indent + 1);
		} else {
			result += formatNftDescriptonJson(keys[i], values[i], indent); 
		}

		if (i < keys.length - 1) {
			result += '<br>';
		}
	}

	return result
}

function formatNftDescriptonJson(key, value, indent) {
	let tab = '';
	for (let i = 0; i < indent; i++) {
		tab += '    ';
	}

	return tab + '<strong>' + key + '</strong>: ' + value;
}

function getAssetTitle(asset, iconIsToTheLeft) {
	return getAssetTitleParams(asset.tokenId, asset.name, iconIsToTheLeft);
}

function getAssetTitleParams(tokenId, name, iconIsToTheLeft) {
	let imgSrc = '';
	if (hasIcon(tokenId)) {
		imgSrc = getIcon(tokenId);
	}

	let iconHtml = '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="' + imgSrc + '"/>';

	if (tokenId == 'ERG') {
		return name;
	}

	return '<a href="' + getTokenUrl(tokenId) + '">' + (iconIsToTheLeft ? iconHtml + ' ' : '') + ((name == '' || name == null) ? formatAddressString(tokenId, 15) : name) + (iconIsToTheLeft ? '' : ' ' + iconHtml) + '</a>';
}

function getAssetValue(amount, decimals) {
	return amount / Math.pow(10, decimals);
}

function onTokenIconLoad(element) {
	$(element).show();
}

function zeroPad (num, places) {
	return String(num).padStart(places, '0');
}

//Mainnet/Testnet
function setupMainnetTestnet() {
	networkType = localStorage.getItem('network');
	
	if (networkType == undefined) {
		networkType = 'mainnet';
	}

	if (networkType == 'testnet') {
		$('#networkType').html('Testnet')
		$('#networkType').removeClass('text-light');
		$('#networkType').addClass('erg-span-important');
		localStorage.setItem('network', 'testnet');
		API_HOST = API_HOST_2 = 'https://api-testnet.ergoplatform.com/';
		FEE_ADDRESS = 'Bf1X9JgQTUtgntaer91B24n6kP8L2kqEiQqNf1z97BKo9UbnW3WRP9VXu8BXd1LsYCiYbHJEdWKxkF5YNx5n7m31wsDjbEuB3B13ZMDVBWkepGmWfGa71otpFViHDCuvbw1uNicAQnfuWfnj8fbCa4';
	} else {
		$('#networkType').html('Mainnet')
	}
}

function switchToMainnet(e) {
	e.preventDefault();

	if (networkType == 'mainnet') return;

	localStorage.setItem('network', 'mainnet');

	window.location.assign('/');
}

function switchToTestnet(e) {
	e.preventDefault();

	if (networkType == 'testnet') return;

	localStorage.setItem('network', 'testnet');

	window.location.assign('/');
}

function setOfficialLink() {
	if (networkType == 'testnet') {
		$('#officialLink').html('https://testnet.ergoplatform.com');
		$('#officialLink').attr('href', 'https://testnet.ergoplatform.com');
	}
}

//Utils
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function copyToClipboard(e, text) {
	e.preventDefault();

	if (navigator.clipboard != undefined) {
		navigator.clipboard.writeText(text);
		$('#toastBody').html('Copied to clipboard!');
	} else {
		$('#toastBody').html('Copy to clipboard failed.');
	}

	showToast();
}

function showCustomToast(text) {
	$('#customToastBody').html(text);

	const toastLiveExample = document.getElementById('customToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function showQRcode(text) {
	if (qrCode == null) {
		 qrCode = new QRCode(document.getElementById('qrcode'), {
			text: text,
			width: 400,
			height: 400,
			colorDark : '#000000',
			colorLight : '#ffffff',
			correctLevel : QRCode.CorrectLevel.H
		});
	}

	$('#qrCodeBack').fadeIn();
	$('#qrCodeBack').css('display', 'flex');

	$('body').css('height', '100%');
	$('body').css('overflow-y', 'hidden');

	window.scrollTo(0, 0);
}

function formatInputsOutputs(data) {
	let formattedData = '';

	for (let i = 0; i < data.length; i++) {
		formattedData += formatBox(data[i]);
	}

	return formattedData;
}

function formatBox(box, trueBox = false) {
	let formattedData = '<div class="row div-cell border-flat p-2">';
		
	let customIdString = '';
	if (box.boxId) {
		customIdString = '<p><strong class="text-white">Box Id: </strong><a href=" ' + getBoxUrl(box.boxId) + '">'+box.boxId.substr(0, 15) + '...' + box.boxId.substr(box.boxId.length - 4)+'</a> <a title="' + box.boxId + '" onclick="copyId(event, this)" href="Copy to clipboard!">&#128203;</a></p>';
	}

	//Address
	addAddress(box.address);
	formattedData += '<div class="col-9">' + customIdString + '<span><strong>Address: </strong></span><a class="address-string" addr="' + box.address + '" href="' + getWalletAddressUrl(box.address) + '" >' + formatAddressString(box.address, 15) + '</a> <a title="' + box.address + '" onclick="copyId(event, this)" href="Copy to clipboard!">&#128203;</a></p>';


	if (trueBox) {
		formattedData += '<p><strong class="text-white">Transaction Id: </strong><a href=" ' + getTransactionsUrl(box.transactionId) + '">'+box.transactionId+'</a> <a title="' + box.transactionId + '" onclick="copyId(event, this)" href="Copy to clipboard!">&#128203;</a></p>';
	}

	//Status

	if (trueBox) {
		formattedData += '<p><strong class="text-white">Spent Transaction Id: </strong><a href=" ' + getTransactionsUrl(box.spentTransactionId) + '">'+box.spentTransactionId+'</a> <a title="' + box.spentTransactionId + '" onclick="copyId(event, this)" href="Copy to clipboard!">&#128203;</a></p>';
		formattedData += '<p><strong class="text-white">Creation height</strong>: ' + box.creationHeight + '</p><p> </p>';
		formattedData += '<p><strong class="text-white">Settlement height</strong>: ' + box.settlementHeight + '</p>';
	}

	formattedData += '</div><div class="col-3 d-flex justify-content-end">' + (box.spentTransactionId === undefined ? '' : box.spentTransactionId === null ? '<span class="text-success">Unspent' : '<span class="text-danger">Spent') + '</span></div>';

	//Value
	formattedData += '<div style="padding-bottom:10px;" class="col-10"><span><strong>Value: </strong></span><span class="">' + formatErgValueString(box.value, 5) + ' <span class="text-light">' + formatAssetDollarPriceString(box.value, ERG_DECIMALS, 'ERG') + '</span></span></div>';
	
	//Output transaction
	if (box.outputTransactionId != undefined) {
		formattedData += '<div class="col-2 d-flex justify-content-end"><a href="' + getTransactionsUrl(box.outputTransactionId) + '" >Output</a></div>';
	}

	//Assets
	if (box.assets != undefined && box.assets.length > 0 ) {
		formattedData += '<h5><strong>Tokens:</strong></h5>';
		for (let j = 0; j < box.assets.length; j++) {
			let asset = box.assets[j];
			let assetPrice = formatAssetDollarPrice(asset.amount, asset.decimals, asset.tokenId);
			formattedData += '<p><strong>' + getAssetTitle(asset, true) + '</strong>: <span class="text-white">' + formatAssetValueString(asset.amount, asset.decimals, 4) + ' ' + (assetPrice == -1 ? '' : '<span class="text-light">' + formatDollarPriceString(assetPrice) + '</span>') + '</span></p>';
		}
	}

	if (trueBox) {		
		formattedData += '<p> </p><p style="margin-bottom:5px;"><strong class="text-white">Ergo tree:</strong></p> <div style="word-wrap:break-word;background: var(--striped-1);" class="div-cell-dark">' + box.ergoTree + '</div>';
	}

	formattedData += '</div>';

	return formattedData;
}

function showLoadError(message) {
	$('#loadErrorMessage').html(message);
	$('#loadError').show();
}

function animateDots() {
	let dots = $('#dots').html();

	if (dots == '...') { dots = ''; }
	else if (dots == '..') { dots = '...'; }
	else if (dots == '.') { dots = '..'; }
	else if (dots == '') { dots = '.'; }

	$('#dots').html(dots);
}

function showToast() {
	const toastLiveExample = document.getElementById('liveToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function showNotificationPermissionToast() {
	const toastLiveExample = document.getElementById('notificationToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function hideNotificationPermissionToast() {
	$('#notificationToast').fadeOut(200);
}

function requestNotificationPermission(action) {
	Notification.requestPermission((result) => {
		action();
	});
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }

    return true;
}

function scrollToElement(element) {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(element).offset().top
    }, 200);
}

function millisToMinutesAndSeconds(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ' min ' + (seconds < 10 ? '0' : '') + seconds + ' sec';
}

function clamp (num, min, max) {
	return Math.min(Math.max(num, min), max);
}

function nFormatter(num, digits) {
	const lookup = [
		{ value: 1, symbol: '' },
	//	{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'B' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' }
	];

	if (num > 10) {
		digits = 2;
	}

	let minimumFractionDigits = 2;
	if (digits < minimumFractionDigits) {
		minimumFractionDigits = digits;
	}

	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
	var item = lookup.slice().reverse().find(function(item) {
		return num >= item.value;
	});
	
	return item ? (num / item.value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits }).replace(rx, '$1') + item.symbol : num.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits });
}

function sortTokens(tokens) {
	if (tokens == undefined) {
		return new Array();
	}

	let tokensArray = tokens.sort((a, b) => {
		let aAmount = a.amount / Math.pow(10, a.decimals);
		let bAmount = b.amount / Math.pow(10, b.decimals);

		if (aAmount === bAmount) return 0;

		return aAmount > bAmount ? -1 : 1;
	});

	tokensArray.sort((a, b) => {
		let aAmount = a.amount / Math.pow(10, a.decimals);
		let bAmount = b.amount / Math.pow(10, b.decimals);

		if (aAmount > 10000000000) return 1;
	    if (bAmount > 10000000000) return -1;
	    return 0;
	});

	return tokensArray
}

function isAsciiArt(string) {
	return (string != null && string.includes('▉'));
}

function switchTheme(e) {
	e.preventDefault();

	if (theme == 'dark') {
		theme = 'light';
	} else {
		theme = 'dark';
	}

	$('html').attr('data-bs-theme', theme);

	localStorage.setItem('theme', theme);

	updateTheme();
}

function getOwnerTypeClass(type) {
    switch (type) {
        case 'Exchange':
            return 'text-success';

        case 'Service':
            return 'text-warning';

        case 'NFT Artist':
        	return 'text-info';

        case 'Mining pool':
        	return 'text-danger';

        default:
        	return '';
    }
}

//Addressbook
function getAddressesInfo() {
	var jqxhr = $.post(ERGEXPLORER_API_HOST + 'addressbook/getAddressesInfo',
		{'addresses' : addresses},
	function (data) {
		if (data.total == 0) return;

		addressbook = data.items;

		$('.address-string').each(function(index) {
			$(this).html(getOwner($(this).attr('addr')));
		});
	});
}

function addAddress(address) {
	for (let i = 0; i < addresses.length; i++) {
		if (addresses[i] == address) {
			return;
		}
	}

	addresses.push(address);
}

function getOwner(address) {
	for (var i = 0; i < addressbook.length; i++) {
		if (addressbook[i]['address'] == address) {
			let owner = addressbook[i]['name'];

			if (addressbook[i]['urltype'] != '') {
				owner += ' (' + addressbook[i]['urltype'] + ')';
			} else {
				owner += ' (' + addressbook[i]['address'].substr(-4) + ')';
			}

			return owner;
		}
	}

	return undefined;
}

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function getDecimals(value, additional = 2) {
	if (value < 0) {
		value *= -1;
	}

	value = value.toString();
    if (value.includes('e-')) {
        let eIndex = value.indexOf('e-');
        return value.substr(eIndex + 2);
    }

	let decimals = 2;
	value = value.split('.');
	if (value.length > 1) {
		let realSmall = value[1].split('-');
		if (realSmall.length > 1) {
			decimals = parseInt(realSmall[1]) + 1;
		} else {
			for (let j = 0; j < value[1].length; j++) {
				if (value[1][j] != '0') {
					decimals = j + additional;

					if (value[1].length > j + 1
	                	&& value[1][j + 1] != '0') {
	                	decimals++;
	                }

					break;
				}
			}
		}
	} else {
		decimals = 2;
	}

	if (decimals < 2) {
		decimals = 2;
	}

	return decimals;
}

function copyId(e, element) {
	copyToClipboard(e, $(element).attr('title'));
}