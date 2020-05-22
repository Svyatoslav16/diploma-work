document.querySelectorAll('.button-action').forEach(elem => {
    elem.onclick = changeByButton;
});
document.querySelectorAll('.count-value').forEach(elem => {
    elem.onchange = changeWithInput;
});
document.querySelectorAll('.menu-control-button').forEach(elem => {
    elem.onclick = deleteByButton;
});

/** Изменяет кол-во выбранного товара в БД при нажатии управляющих кнопок. Если кол-во товара < 1, то товар удаляется */
function changeByButton() {
    this.disabled;
    let productStock = parseInt(this.parentNode.parentNode.parentNode.querySelector('.product-remains').innerText.split(':')[1]);
    if((this.parentNode.querySelector('.count-value').value <= productStock && this.classList[1].split('-')[1] === 'minus') ||
       (this.parentNode.querySelector('.count-value').value < productStock && this.classList[1].split('-')[1] === 'plus')) {
        fetch('/changeCountByButton', {
            method: 'POST',
            body: JSON.stringify({
                product_id: this.dataset.product_id,
                action: this.classList[1].split("-")[1],
                nodeName: this.nodeName,
                product_count: this.parentNode.querySelector('.count-value').value
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if(res.ok) {
                if (this.classList[1].split("-")[1] === 'plus') {
                    this.previousElementSibling.value++;
                } else if(this.classList[1].split("-")[1] === 'minus') {
                    if(this.nextElementSibling.value === '1') {
                        this.parentNode.parentNode.parentNode.parentNode.remove();
                    } else  {
                        this.nextElementSibling.value--;
                    }
                }
                totalAmount();
            } else if(!res.ok) {
                return res.json();
            }
        }).then(body => {
            if(body !== undefined) {
                if (this.classList[1].split("-")[1] === 'plus') {
                    this.previousElementSibling.value = body.stock;
                } else if(this.classList[1].split("-")[1] === 'minus') {
                    this.nextElementSibling.value = body.stock;
                }
                totalAmount();
                this.enabled;
            }
        });
    } else {
        this.parentNode.parentNode.parentNode.querySelector('.product-remains').style.color = 'red';
        setTimeout(() => {
            this.parentNode.parentNode.parentNode.querySelector('.product-remains').style.color = 'initial';
        }, 1000);
    }
}

/** Удаляет товар из корзины */
function deleteByButton() {
    this.disabled;
    fetch('/deleteProductInCart', {
        method: 'POST',
        body: JSON.stringify({
            product_id: this.dataset.product_id,
            action: 'delete',
            nodeName: this.nodeName,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        if(res.ok) {
            this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
            totalAmount();
        } else {
            console.log(res.status);
        }
    });
}

/** Изменяет кол-во выбранного товара в БД при изменении значения в input с классом count-value */
function changeWithInput() {
    if(this.value >= 1) {
        fetch('/changeCountByInput', {
            method: 'POST',
            body: JSON.stringify({
                product_id: this.dataset.product_id,
                action: 'changeByInput',
                nodeName: this.nodeName,
                product_count: this.value
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if(res.ok) {
                totalAmount();
            } else if(!res.ok) {
                return res.json();
            }
        }).then(body => {
            if(body !== undefined) {
                this.value = body.stock;
                this.style.color = "red";
                this.parentNode.parentNode.parentNode.querySelector('.product-remains').style.color = 'red';
                setTimeout(() => {
                    this.style.color="#666";
                    this.parentNode.parentNode.parentNode.querySelector('.product-remains').style.color = 'initial';
                }, 1000);
                totalAmount();
            }
        });
    }
}

/** При изменении кол-ва товара пересчитывает итоговую стоимость корзины пользователя */
function totalAmount() {
    let priceValue = document.querySelector('.price').childNodes[0];
    let productList = document.querySelectorAll('.product');
    document.getElementsByClassName('total-amount-count')[0].innerText = `Итого: ${document.getElementsByClassName('product').length} товар(а) на`;
    priceValue.nodeValue = 0;
    if(productList.length > 0) {    
        productList.forEach(elem => {
            priceValue.nodeValue =  parseInt(priceValue.nodeValue) + 
                            (elem.children[1].children[1].children[0].children[1].value * 
                            elem.children[1].children[2].children[0].children[0].innerText); 
        });
    } else if(productList.length == 0) {
        document.getElementsByClassName('cart-items')[0].remove();
        document.getElementsByClassName('total-amount')[0].remove();
        document.getElementsByClassName('main-container')[0].innerHTML = `<div>Ваша корзина пуста</div>`;
    }
}