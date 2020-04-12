function addToCart() {
    fetch('/addToCart', {
        method: 'POST',
        body: JSON.stringify({product_id: this.dataset.product_id}),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then((res) => {
        if(res.status == '200') {
            this.innerText = 'Товар добавлен';
        } else if(res.status == '204') {
            this.innerText = 'Уже в корзине';
        }
    });
}

document.querySelectorAll('.add-to-cart').forEach(element => {
	element.onclick = addToCart;
});