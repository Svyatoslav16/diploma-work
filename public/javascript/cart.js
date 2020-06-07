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
    let priceValue = document.querySelector('.price').children[0];
    let productList = document.querySelectorAll('.product');
    document.getElementsByClassName('total-amount-count')[0].innerText = `Итого: ${document.getElementsByClassName('product').length} товар(а) на`;
    priceValue.innerText = 0;
    if(productList.length > 0) {    
        productList.forEach(elem => {
            console.log('priceValue: ' + priceValue.innerText);
            console.log(elem.children[1].children[1].children[0].children[1].value);
            console.log(elem.children[1].children[2].children[0].children[0].innerText);
            priceValue.innerText =  Math.round(parseFloat(priceValue.innerText) * 100) / 100 + 
                            (elem.children[1].children[1].children[0].children[1].value * 
                            elem.children[1].children[2].children[0].children[0].innerText);
        });
    } else if(productList.length == 0) {
        document.getElementsByClassName('cart-items')[0].remove();
        document.getElementsByClassName('total-amount')[0].remove();
        document.getElementsByTagName('main')[0].innerHTML = `
            <h1 class="cart-title">Корзина</h1>
            <div class="empty_cart_wrap">
                <svg class="empty_cart" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 469.333 469.333" xml:space="preserve">
                    <g>
                        <path d="M434.979,42.667H85.333v3.061l-4.375-14.999C75.687,12.635,58.844,0,40,0H10.667C4.771,0,0,4.771,0,10.667     s4.771,10.667,10.667,10.667H40c9.427,0,17.844,6.313,20.479,15.365l66.396,227.635l-34.021,42.521     c-4.854,6.073-7.521,13.688-7.521,21.458c0,18.948,15.406,34.354,34.354,34.354H416c5.896,0,10.667-4.771,10.667-10.667     c0-5.896-4.771-10.667-10.667-10.667H119.687c-7.177,0-13.021-5.844-13.021-13.021c0-2.948,1.01-5.844,2.854-8.135l34.279-42.844     h209.221c16.448,0,31.604-9.615,38.615-24.5l74.438-158.177c2.135-4.552,3.26-9.604,3.26-14.615v-3.021     C469.333,58.073,453.927,42.667,434.979,42.667z M448,80.042c0,1.906-0.427,3.823-1.24,5.542L372.333,243.75     c-3.51,7.438-11.083,12.25-19.313,12.25H146.667L90.663,64h344.316C442.156,64,448,69.844,448,77.021V80.042z"/>
                        <path d="M128,384c-23.531,0-42.667,19.135-42.667,42.667s19.135,42.667,42.667,42.667s42.667-19.135,42.667-42.667     S151.531,384,128,384z M128,448c-11.76,0-21.333-9.573-21.333-21.333c0-11.76,9.573-21.333,21.333-21.333     c11.76,0,21.333,9.573,21.333,21.333C149.333,438.427,139.76,448,128,448z"/>
                        <path d="M384,384c-23.531,0-42.667,19.135-42.667,42.667s19.135,42.667,42.667,42.667s42.667-19.135,42.667-42.667     S407.531,384,384,384z M384,448c-11.76,0-21.333-9.573-21.333-21.333c0-11.76,9.573-21.333,21.333-21.333     c11.76,0,21.333,9.573,21.333,21.333C405.333,438.427,395.76,448,384,448z"/>
                    </g>
                </svg>
            </div>`;
    }
}