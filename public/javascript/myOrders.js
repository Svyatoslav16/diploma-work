let orders = document.getElementsByClassName('order');
for (let i = 0; i < orders.length; i++) {
    orders[i].onclick = orderDetails;
}

function orderDetails() {
    document.location.href = `${document.location.href.replace('myOrders', 'order')}?orderId=${this.dataset.order_id}`;
}