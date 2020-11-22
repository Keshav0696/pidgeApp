

function dynamicallyLoadStyle(url) {
	var link = document.createElement("link");
    link.setAttribute("rel", "stylesheet")
    link.setAttribute("type", "text/css")
    link.setAttribute("href", url)
    // link.href = url;
    document.head.appendChild(link);
}

function dynamicallyLoadScript(url) {
    var script = document.createElement("script");
    script.src = url;
    document.head.appendChild(script);
}

var geturl = new URL($('script[src*="abondendcartapp.js"]').attr('src'));
var shop = geturl.searchParams.get("shop");

var availableDates = [];
var availableTimes = [];

function load_html_on_load(shopUrl) {
	$.ajax({
	    dataType: "json",
	    url: "https://pidgeapi.udaantechnologies.com/api/deliverySettings/shippingSlots",
	    cache: !1,
	    traditional: !0,
	    type: "post",
	    data:{"shop": shopUrl },
	    beforeSend: function() {
	        // console.log("before send");
	    },
	    success: function(result) {
	    	availableDates = [];
	    	$("#shipping_slots").html("");
	    	if(result['status'] == "success" && result['availableDates'].length > 0) {
	    		availableDates = result['availableDates'];
	    		var strDate = "<div id='shipping_slots' style='display: block; text-align: center'>";
	    		strDate += "<div id='requiredDilivery' style='display:none; color: red; font-size: 16px; text-align: center;'>Please select Delivery date and time</div>"; 
				strDate+= "<h2  style='text-transform: capitalize; letter-spacing: inherit;'>Pick an Order Date</h2>";
				strDate+= "<input type='text' placeholder='Pick a date' id='delivery_date' readonly='readonly' style='padding: 8px 15px;width: 250px;background: url(https://pidgeapi.udaantechnologies.com/date_icon.png) #e8e8e8 no-repeat 100% 0;margin-bottom: 15px;background-size: 41px;'><br>";
				strDate+= "<select id='delivery_time' onchange='updateCart();' style='padding: 8px 15px; width: 250px;  background: url(https://pidgeapi.udaantechnologies.com/slt_icon.png); background-repeat: no-repeat; background-position: 100% 2px; margin-bottom: 15px;'>";
				strDate+= "<option value=''>Select order time</option>";
				strDate+= "</select>";
				strDate+= "</div>";
				$('#checkoutbtn').remove();
				$('input[name="checkout"]').parent().parent().after(strDate);
				$('input[name="checkout"]').hide();
				$('input[name="checkout"]').after('<input type="button" id="checkoutbtn" value="Checkout" class="cart__submit btn btn--small-wide" onclick="submitCart()">')
	  			// $(".cart__buttons-container").after(strDate);
	  			$('#delivery_date').datepicker({
	  				beforeShowDay: available,
	  				dateFormat: "dd-mm-yy",
	  				onSelect: ((date, obj) => {
	  					$('#requiredDilivery').hide();
	  					$.ajax({
	  						url: "https://pidgeapi.udaantechnologies.com/api/deliverySettings/shippingSlotsTime",
	  						dataType: "json",
	  						cache: !1,
	  						traditional: !0,
	  						type: "post",
	  						data: { "selectedDate": date, "shop": shopUrl },
	  						success: function(resultTime) {
	    						availableTimes = [];
	  							if(resultTime['status'] == "success" && resultTime['availableTimes'].length > 0) {
	  								availableTimes = resultTime['availableTimes'];
	  								var strTime = "<option value=''>Select order time</option>";
	  								for(var i=0; i<availableTimes.length; i++) {
										strTime+= "<option value="+availableTimes[i]+"> "+availableTimes[i]+"</option>";
									}
									$("#delivery_time").html(strTime);
	  							} else {
	  								var strTime = "<option value=''>Select order time</option>";
	  								$("#delivery_time").html(strTime);
	  							}
	  						},
	  						error: function(errorTime) {
	  							// console.log(errorTime)
	  						}
	  					})
	  				})
	  			}); 
			} else {
		  		// console.log("Status failure");
		  	}
	    },
	    error: function(e) {
	      	console.log("Error", e);
	    },
	    complete: function() {
	        // console.log('complete');
	    },
	}); //end ajax
}

function available(date) {
  dmy = date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear();
  if ($.inArray(dmy, availableDates) != -1) {
    return [true, "","Available"];
  } else {
    return [false,"","unAvailable"];
  }
}

// function updateCart(sel) {
// 	var orderTime = sel.value;
// 	var orderDate = $('#delivery_date').val();
// 	let formData = {
// 	 'note': "deliveryDate:"+orderDate+",deliveryTime:"+orderTime
// 	}
// 	fetch('/cart/update.js', {
// 	  method: 'POST',
// 	  headers: {
// 	    'Content-Type': 'application/json'
// 	  },
// 	  body: JSON.stringify(formData)
// 	})
// 	.then(response => {
// 	  // console.log('Response:', response)
// 	})
// 	.catch((error) => {
// 	  // console.error('Error:', error);
// 	});
// }

function updateCart() {
	$('#requiredDilivery').hide();
}

function submitCart(){
	var orderDate = $('#delivery_date').val();
	var orderTime = $('#delivery_time').val();
	if(orderDate == '' || orderTime == '') {
		$('#requiredDilivery').show();
		return;
	}
	let formData = {
	 'note': "deliveryDate:"+orderDate+",deliveryTime:"+orderTime
	}
	fetch('/cart/update.js', {
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json'
	  },
	  body: JSON.stringify(formData)
	})
	.then(response => {
	  // console.log('Response:', response)
	})
	.catch((error) => {
	  // console.error('Error:', error);
	});	
	$('input[name="checkout"]').click();
	// $('form').submit();
}


(function() {
	var path = window.location.pathname;
	//if(window.location.href.indexOf("cart") > -1)
	if( path.includes('cart', 0)) {
		dynamicallyLoadStyle("https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css");
		// dynamicallyLoadScript("https://code.jquery.com/jquery-2.2.4.min.js");
		// dynamicallyLoadScript("https://code.jquery.com/ui/1.12.0/jquery-ui.js");
		load_html_on_load(shop);	
	}
})();