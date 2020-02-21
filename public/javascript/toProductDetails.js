let products = document.getElementsByClassName('product');
for (let i = 0; i < products.length; i++) {
    products[i].onclick = productDetails;
}

function productDetails() {
    document.location.href = `${document.location.href.split('/')[0]}/product?productId=${this.dataset.product_id}`;
}