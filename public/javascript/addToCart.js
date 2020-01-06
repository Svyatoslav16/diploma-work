function addToCart() {
    fetch('/addToCart', {
        method: 'POST',
        body: JSON.stringify({product_id: this.dataset.product_id}),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then((response) => {
        return response.text();
    }).then((body) => {
        console.log(body);
	});
}

document.querySelectorAll('.add-to-cart').forEach(element => {
	element.onclick = addToCart;
});


