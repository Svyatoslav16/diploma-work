let products = document.getElementsByClassName('product');
for (let i = 0; i < products.length; i++) {
    products[i].onclick = editProductProperties;
}
function editProductProperties() {                                                                                                                            
    this.children[(this.children.length - 1)].children[0].classList.toggle('active');
}