document.querySelectorAll('.button-action').forEach(elem => {
    elem.onclick = changeByButton;
});
document.querySelectorAll('.count-value').forEach(elem => {
    elem.onchange = changeWithInput;
});
document.getElementsByClassName('buy-button')[0].onclick = orderRegistration;

/** Изменяет кол-во выбранного товара в БД при нажатии управляющих кнопок */
function changeByButton() {
    this.disabled;
    fetch('/changeCountProductInCart', {
        method: 'POST',
        body: JSON.stringify({
            product_id: this.dataset.product_id,
            action: this.classList[1].split("-")[1],
            nodeName: this.nodeName,
        }),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then((res) => {
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
            totalAmount(this);
            this.enabled;
        }
    });
}

/** Изменяет кол-во выбранного товара в БД при изменении значения в input с классом count-value */
function changeWithInput() {
    if(this.value >= 1) {
        fetch('/changeCountProductInCart', {
            method: 'POST',
            body: JSON.stringify({
                product_id: this.dataset.product_id,
                action: 'changeByInput',
                nodeName: this.nodeName,
                input_count: this.value
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then((res) => {
            if(res.ok) {
                totalAmount(this);
            }
        });
    }
    
}

/** При изменении кол-ва товара пересчитывает итоговую стоимость корзины пользователя */
function totalAmount(this_) {
    document.getElementsByClassName('total-amount-count')[0].innerText = `Итого: ${document.getElementsByClassName('product').length} товар(а)`;
    let priceValue = document.querySelector('.price-value');
    priceValue.innerText = 0;
    document.querySelectorAll('.product').forEach(elem => {
        priceValue.innerText =  parseInt(priceValue.innerText) + 
                                (elem.children[1].children[1].children[0].children[1].value * 
                                 elem.children[1].children[2].children[0].children[0].children[0].innerText); 
    });
}

function orderRegistration() {
    fetch('/orderRegistration', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res =>  {
        if(res.ok) {
            res.json().then(data => {
                document.getElementsByTagName('body')[0].style.opacity = 0.2;
                let div_orderRegistrationWrapper = document.createElement('div'),
                    form_orderRegistration = document.createElement('form'),
                    div_userData = document.createElement('div'),
                    input_adress = document.createElement('input'),
                    div_productList = document.createElement('div'),
                    ul = document.createElement('ul');
                div_orderRegistrationWrapper.className = 'order-registration-wrapper';
                form_orderRegistration.className = 'order-registration-form';
                form_orderRegistration.action = '/aaa'
                form_orderRegistration.method = 'POST'
                div_userData.className = 'user-data';
                input_adress.className = 'adress';
                input_adress.placeholder = 'Введите адрес доставки';
                input_adress.value = (data.userAdress) ? data.userAdress : '';
                div_productList.className = 'product-list';
                data.productList.forEach(elem => {
                    let li = document.createElement('li');
                    li.innerText = elem.product_name + ' ' + elem.product_description + ' ' + elem.product_amount
                    ul.append(li);
                });
                div_productList.append(ul); 

                document.getElementsByClassName('main-container')[0].append(div_orderRegistrationWrapper);
                div_orderRegistrationWrapper.append(form_orderRegistration);
                form_orderRegistration.append(div_userData);
                form_orderRegistration.append(div_productList);
                div_userData.append(input_adress);
                // div_orderRegistration.

                // data.productList
            });
        }
    });
}