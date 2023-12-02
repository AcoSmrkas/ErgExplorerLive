var nowTime = Date.now();
var from24h = nowTime - (24 * 60 * 60 * 1000);
var from7d = nowTime - (7 * 24 * 60 * 60 * 1000);
var from30d = nowTime - (30 * 24 * 60 * 60 * 1000);
var priceData = undefined;
var lastBlockHeight = 0;
var animDelay = 50;
var animSpeed = 200;

$(function() {	
	updatePrices();
	getNetworkState();
});

function updatePrices() {
	getPrices(onGotPrices);
	getErgPrice();

	setTimeout(updatePrices, 60000 * 5);

//	showCustomToast('Initialized')
}

function getErgPrice() {
	$.get('https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd&include_24hr_change=true', function (data) {
		let difference = data.ergo.usd_24h_change;

		let classString = 'text-success';
		if (difference < 0) {
			classString = 'text-danger';
		}

		let ergPriceHtml = '$' + formatValue(data.ergo.usd, 2);
		$('#ergPrice').html(ergPriceHtml + ' (<span class="' + classString + '">' + formatValue(difference, 2) + '%</span> 24h)');
	});
}

function onGotPrices() {
	return;

    getProtocolInfo();
    getStats();
	getWhaleTxs();
	getPoolStats();	
	getPriceHistory();
}

function getNetworkState() {
	let networkStateUrl = 'https://api.ergo.aap.cornell.edu/api/v1/networkState';

	if (networkType == 'testnet') {
		networkStateUrl = 'https://api-testnet.ergoplatform.com/api/v1/networkState'
	}

	var jqxhr = $.get(networkStateUrl, function(data) {
		if (lastBlockHeight < data.height) {
			getLatestBlocks();

			if (lastBlockHeight != 0) {
				//showCustomToast('New block mined!')
			}
		}

		lastBlockHeight = data.height;

		setTimeout(getNetworkState, 1000 * 5);
	});
}

function getLatestBlocks() {
	var jqxhr = $.get(API_HOST + 'blocks?limit=1&sortBy=height&sortDirection=desc', function(data) {
		let blockId = data.items[0].id;

		getLatestBlock(blockId);
	})
	.fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

$(document).on('keypress', function(e) {
	if (IS_DEV_ENVIRONMENT) {
	    var tag = e.target.tagName.toLowerCase();
	    if ( e.which === 119 && tag != 'input' && tag != 'textarea') 
        	getLatestBlocks();
	}
});

function getLatestBlock(blockId) {
	var jqxhr = $.get(API_HOST + 'blocks/' + blockId, function(data) {
		let blockData = data.block;

		if (blockData.header.height != lastBlockHeight) {
			getLatestBlocks();
			return;
		}

		if ($('.tx-box').length > 0) {
			$('.tx-box').each(function(i, e) {
				console.log(($('.tx-box').length - i - 1) * animDelay);
				$(e).show().delay(($('.tx-box').length - i - 1) * animDelay).animate({top: '30px', opacity: 0}, animSpeed);

				if (i == $('.tx-box').length - 1) {
					console.log('timeout:' + (i * animDelay + animSpeed));
					setTimeout(printBlock, i * animDelay + animSpeed, blockData);
				}
			});
		} else {
			printBlock(blockData);
		}
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function printBlock(blockData) {
	$('#blockNumber').html('<a target="_new" href="https://ergexplorer.com/blocks/' + blockData.header.id + '">#'+blockData.header.height+'</a>');

	let html = '<div class="col-12">';

	let transactions = blockData.blockTransactions;

	for (let i = 0; i < transactions.length; i++) {
		let transaction = transactions[i];

		html += '<div class="row tx-box p-0"><div style="height: inherit;width:50px;padding:0;"><div style="align-self: center;width:100%;height:100%;text-align:center;display:table;"><a style="display:table-cell;vertical-align:middle;" target="_new" href="https://ergexplorer.com/transactions/' + transaction.id + '">TX '+(i+1)+'</a></div></div><div style="flex:2;">';

		let outputs = transactions[i].outputs;
		let totalNanoErgs = 0;
		for (let j = 0; j < outputs.length; j++) {
			totalNanoErgs += outputs[j].value;
		}

		html += getAssetBox('ERG', totalNanoErgs / Math.pow(10, ERG_DECIMALS));

		for (let j = 0; j < outputs.length; j++) {
			let output = outputs[j];

			let assets = output.assets;

			for (let k = 0; k < assets.length; k++) {
				let asset = assets[k];

				html += getAssetBox((asset.name ? asset.name : asset.tokenId), asset.amount / Math.pow(10, asset.decimals), asset.tokenId);
			}
		}

		html +=  '</div></div>'
	}

	html += '</div>';

	$('#contentHolder').html(html);

	$('.asset-box-value').fitText(0.68);

	$('.asset-box').css('opacity', 0);
	$('.tx-box').css('opacity', 0);
	$('.tx-box').css('top', '30px');
	$('.tx-box').each(function(i, e) {
		$(e).delay(i * animDelay).animate({opacity: 1, top: 0}, animSpeed, function () {
			$($(e).children()[1]).children().each(function(ci, ce) {
				$(ce).delay(ci * 10).animate({opacity: 1}, animSpeed);
			});
		});
	});
}

function getAssetBox(name, value, id) {
	let img = '';
	if (name == 'ERG') {
		img = '<img src="./images/logo.png" style="width:100%;height:100%;" />';
	}

	if (id && hasIcon(id)) {
		let src = getIcon(id);
		img = '<a target="_new" href="https://ergexplorer.com/token/' + id + '"><img src="' + src + '" style="width:100%;height:100%;" /></a>';
	}

	if (img != '') {
		name = img;
	} else {
		name = '<span><a target="_new" href="https://ergexplorer.com/token/' + id + '">'+name+'</a></span>';
	}

	return '<div class="asset-box glass-tx me-1"><div class="row asset-box-value asset-box-name">' + name + '</div><div class="row asset-box-value asset-box-amount"><span>' + nFormatter(value) + '</span></div></div>';
}

function getPoolStats() {
	// Get the current Unix timestamp in milliseconds
	var currentTimestamp = Date.now();

	// Calculate the timestamp for 24 hours ago (subtracting 24 hours in milliseconds)
	var twentyFourHoursAgoTimestamp = currentTimestamp - (24 * 60 * 60 * 1000);
	$.get('https://api.spectrum.fi/v1/amm/pools/stats?from=' + twentyFourHoursAgoTimestamp,
	function (data) {
		let poolStatsData = data;

		for (let i = 0; i < poolStatsData.length; i++) {
			for (let j = i + 1; j < poolStatsData.length; j++) {
				if (poolStatsData[i].lockedY.id === poolStatsData[j].lockedY.id) {
					poolStatsData[i].volume.value += poolStatsData[j].volume.value;
					poolStatsData.splice(j, 1);
					j--;
				}
			}
		}

		poolStatsData.sort(function (a, b) {
			if (a.volume.value === b.volume.value) return 0;

			return a.volume.value > b.volume.value ? -1 : 1;
		});

		//Volume
		let formattedResult = '';
		let ids = ['ERG'];
		for (let i = 0; i < 10; i++) {
			let poolStat = poolStatsData[i];
			ids.push(poolStat.lockedY.id);

			formattedResult += '<tr>';

			//Token
			formattedResult += '<td><span class="d-lg-none"><strong>Token: </strong></span><a href="' + getTokenUrl(poolStat.lockedY.id) + '">' + getAssetTitleParams(poolStat.lockedY.id, poolStat.lockedY.ticker, true) + '</a></td>';
			
			//Volume
			formattedResult += '<td><span class="d-lg-none"><strong>Volume: </strong></span>$' + formatValue(poolStat.volume.value, 2) + '</td>';

			formattedResult += '</tr>';
		}

		$('#tokensVolumeTableBody').html(formattedResult);
	});
}

function getPriceHistory() {
	$.post(ERGEXPLORER_API_HOST + 'tokens/getPriceHistory',
		{
			'from': nowTime,
			'milestones': 'true',
			'period': '30d'
		},
	function(data) {
		priceData = data;
		printGainersLosers(from24h);
	}).fail(function (data) {
		$('#tokenLoading').hide();
	});
}

function printGainersLosers30d() {
	printGainersLosers(from30d);
	$('#showGainersLosers30d').removeClass('btn-primary');
	$('#showGainersLosers30d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
}

function printGainersLosers7d() {
	printGainersLosers(from7d);
	$('#showGainersLosers7d').removeClass('btn-primary');
	$('#showGainersLosers7d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers24h() {
	printGainersLosers(from24h);
	$('#showGainersLosers24h').removeClass('btn-primary');
	$('#showGainersLosers24h').addClass('btn-info');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers(timeframe) {
	let data = JSON.parse(JSON.stringify(priceData));

	let lastTimestamp = timeframe;
	for (var i = data.items.length - 1; i >= 0; i--) {
		let item = data.items[i];
		if (item.originaltimestamp != lastTimestamp
			|| item.ticker == 'ERG') {
			data.items.splice(i, 1);
			continue;
		}

		let oldPrice = item.price;
		let newPrice = prices[item.tokenid];

		if (newPrice == undefined) {
			data.items.splice(i, 1);
			continue;
		}

		console.log(prices);

		console.log(item.tokenid, oldPrice, newPrice);

		let difference = (newPrice * 100 / oldPrice) - 100;
		if (difference === 0) {
			difference = 0.000001;
		}

		difference = toFixed(difference, 2);

		data.items[i].difference = difference;
	}

	data.items = data.items.sort(function (a, b) {
		if (a.difference === b.difference) return 0;

		return parseFloat(a.difference) > parseFloat(b.difference) ? -1 : 1;
	});

	//Erg
	for (let i = 0; i < data.items.length; i++) {
		let item = data.items[i];
		let difference = item.difference;
		let classString = 'text-success';

		if (difference > 0) {
			difference = '+' + difference;
		} else {
			difference = difference;
			classString = 'text-danger';
		}	

		if (item.tokenid == 'ERG') {		
			data.items.splice(i, 1);

			break;
		}
	}

	//Gainers
	let formattedResult = '';
	let end = 5;
	for (let i = 0; i < end; i++) {
		let item = data.items[i];
		let difference = item.difference;
		let classString = 'text-success';

		if (difference >= 0) {
			difference = '+' + difference;
		} else {
			difference = difference;
			classString = 'text-danger';
		}			

		$('#change-' + item.tokenid).html(difference + '%');
		$('#change-' + item.tokenid).addClass(classString);

		formattedResult += '<tr>';

		//Token
		formattedResult += '<td><span class="d-lg-none"><strong>Token: </strong></span><a href="' + getTokenUrl(item.tokenid) + '">' + getAssetTitleParams(item.tokenid, item.ticker, true) + '</a></td>';
		
		//Price			
		let decimals = getDecimals(prices[item.tokenid]);

		formattedResult += '<td><span class="d-lg-none"><strong>Price: </strong></span>$' + formatValue(prices[item.tokenid], decimals) + '</td>';

		//Change
		formattedResult += '<td><span class="d-lg-none"><strong>Change: </strong></span><span class="' + classString + '">' + difference + '%</span></td>';

		formattedResult += '</tr>';

		if (i == 4) {
			i = data.items.length - end - 1;
			end = data.items.length;
		}
	}

	$('#tokensGainersTableBody').html (formattedResult);

	$('#tokenView').show();
	$('#tokenLoading').hide();
}

function getWhaleTxs() {
	if (networkType == 'testnet') {
		return;
	}

	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'transactions/getWhaleTxs',
	function(data) {
		let formattedResult = '';
		let items = data.items;

		for (var i = 0; i < items.length; i++) {
			let item = items[i];

			formattedResult += '<tr>';

			//Tx
			formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.txid) + '"><i class="fas fa-link text-info"></i></a></td>';
			
			//Time
			formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(parseInt(item.time)) + '</td>';

			//From
			let fromAddress = item.fromaddress;
			addAddress(fromAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span>' + (fromAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + fromAddress + '" href="' + getWalletAddressUrl(fromAddress) + '" >' + (getOwner(fromAddress) == undefined ? formatAddressString(fromAddress, 10) : getOwner(fromAddress)) + '</a>') + '</td>';
		
			//To
			let toAddress = item.toaddress;
			addAddress(toAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span>' + (toAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + toAddress + '" href="' + getWalletAddressUrl(toAddress) + '" >' + (getOwner(toAddress) == undefined ? formatAddressString(toAddress, 10) : getOwner(toAddress)) + '</a>') + '</td>';

			//Value
			formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span>' + formatAssetValueString(item.value, item.decimals) + ' ' + getAssetTitleParams(item.tokenid, item.ticker, false) + ' <span class="text-light">' + formatDollarPriceString(item.value / Math.pow(10, item.decimals) * prices[item.tokenid]) + '</span></td></tr>';

			formattedResult += '</tr>';
		}

		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();	

		getAddressesInfo();
    });
}

function getProtocolInfo() {
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergVersion').html(data.version);
	    $('#ergSupply').html(formatErgValueString(data.supply, 0));
	    $('#ergTotal').html(formatErgValueString(97739924000000000, 0));
	    $('#ergHashRate').html(formatHashRateString(data.hashRate));
	    $('#ergTxAvg').html(data.transactionAverage);

    	$('#marketCap').html('$' + (prices['ERG'] * getAssetValue(data.supply, ERG_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
	  }
	});

	xhr.open('GET', 'https://api.ergoplatform.com/info');
	xhr.setRequestHeader('content-type', 'application/json');

	xhr.withCredentials = false;

	xhr.send();
}

function getStats() {
	let statsUrl = 'https://api.ergoplatform.com/stats';

	if (networkType == 'testnet') {
		statsUrl = 'https://api-testnet.ergoplatform.com/stats';
	}

	var jqxhr = $.get(statsUrl, function(data) {
		
		//Blocks summary
		//Blocks mined
		$('#statsBlocksMined').html('<p>' + data.blockSummary.total + '</p>');

		//Average mining time
		$('#statsAverageMiningTime').html('<p>' + millisToMinutesAndSeconds(data.blockSummary.averageMiningTime) + '</p>');

		//Coins mined
		$('#statsCoinsMined').html('<p class="text-white">' + formatErgValueString(data.blockSummary.totalCoins, 0) + ' <span class="text-light">' + formatAssetDollarPriceString(data.blockSummary.totalCoins, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Transactions summary
		//Number of transactions
		$('#statsNumberOfTransactions').html('<p>' + data.transactionsSummary.total + '</p>');

		//Total transaction fees
		$('#statsTotalTransactionFees').html('<p class="text-white">' + formatErgValueString(data.transactionsSummary.totalFee) + ' <span class="text-light">' + formatAssetDollarPriceString(data.transactionsSummary.totalFee, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Total output volume
//		$('#statsTotalOutputVolume').html('<p class="text-white">' + formatErgValueString(data.transactionsSummary.totalOutput) + ' <span class="text-light">' + formatAssetDollarPriceString(data.transactionsSummary.totalOutput, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Mining cost
		//Blocks mined
		$('#statsTotalMinersRevenue').html('<p class="text-white">' + formatErgValueString(data.miningCost.totalMinersRevenue) + ' <span class="text-light">' + formatAssetDollarPriceString(data.miningCost.totalMinersRevenue, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Average mining time
		$('#statsEarnedFromTransactionFees').html('<p>' + data.miningCost.percentEarnedTransactionsFees + '%</p>');

		//Coins mined
		$('#statsOfTransactionVolume').html('<p>' + data.miningCost.percentTransactionVolume + '%</p>');

		//Number of transactions
		$('#statsCostPerTransaction').html('<p class="text-white">' + formatErgValueString(data.miningCost.costPerTransaction) + ' <span class="text-light">' + formatAssetDollarPriceString(data.miningCost.costPerTransaction, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Total transaction fees
		$('#statsDifficulty').html('<p>' + data.miningCost.difficulty + '</p>');

		//Total output volume
		$('#statsHashRate').html('<p>' + formatHashRateString(data.miningCost.hashRate) + '</p>');

		$('#statsHolder').show();
    });
}