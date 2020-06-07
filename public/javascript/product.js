let input = document.getElementsByClassName('quantity__input')[0];
let total = document.getElementsByClassName('total_amount__span')[0];
const productData = {
    price: document.querySelector('.product_price__price-current').innerText,
    inStock: document.querySelector('.in_stock span').innerText
};

document.getElementsByClassName('quantity_wrap__minus')[0].addEventListener('click', el => {
    if (+el.target.nextElementSibling.value > 1 &&
        +el.target.nextElementSibling.value <= +productData.inStock) {
        el.target.nextElementSibling.value--;
        recalculation();
    } else if(+el.target.nextElementSibling.value <= 1) {
        el.target.nextElementSibling.style.color = 'rgb(255, 78, 78)';
        setTimeout(() => { 
            el.target.nextElementSibling.style.color = 'inherit';
            el.target.nextElementSibling.value = 1;
            recalculation();
        }, 500);
    } else if(+el.target.nextElementSibling.value >= +productData.inStock) {
        el.target.nextElementSibling.style.color = 'rgb(255, 78, 78)';
        document.querySelector('.in_stock').style.color = 'rgb(255, 78, 78)';
        setTimeout(() => { 
            el.target.nextElementSibling.style.color = 'inherit';
            document.querySelector('.in_stock').style.color = 'inherit';
            el.target.nextElementSibling.value = productData.inStock;
            recalculation();
        }, 500);
    }
});

document.getElementsByClassName('quantity_wrap__plus')[0].addEventListener('click', el => {
    if (+el.target.previousElementSibling.value > 0 &&
        +el.target.previousElementSibling.value < +productData.inStock) {
        el.target.previousElementSibling.value++;
        recalculation();
    } else if(+el.target.previousElementSibling.value <= 0) {
        el.target.previousElementSibling.value = 1;
        recalculation();
    } else if(+el.target.previousElementSibling.value >= +productData.inStock) {
        el.target.previousElementSibling.style.color = 'rgb(255, 78, 78)';
        document.querySelector('.in_stock').style.color = 'rgb(255, 78, 78)';
        setTimeout(() => { 
            el.target.previousElementSibling.style.color = 'inherit';
            document.querySelector('.in_stock').style.color = 'inherit';
            el.target.previousElementSibling.value = productData.inStock;
            recalculation();
        }, 500);
    }
});

document.getElementsByClassName('quantity__input')[0].addEventListener('input', el => {
    if (+el.target.value > 0 &&
        +el.target.value <= +productData.inStock &&
        el.target.value !== '') {
        recalculation();
    } else if(+el.target.value <= 0 &&
        el.target.value !== '') {
        el.target.value = 1;
        recalculation();
    } else if(+el.target.value > +productData.inStock &&
        el.target.value !== '') {
        el.target.style.color = 'rgb(255, 78, 78)';
        document.querySelector('.in_stock').style.color = 'rgb(255, 78, 78)';
        setTimeout(() => { 
            el.target.style.color = 'inherit';
            document.querySelector('.in_stock').style.color = 'inherit';
            el.target.value = productData.inStock;
            recalculation();
        }, 500);
    }
});

document.getElementsByClassName('button_wrap__add_to_cart_button')[0].addEventListener('click', el => {
    console.log(el.target)
    console.log(el.target.dataset)
    fetch('/addToCartWithQuantity', {
        method: 'POST',
        body: JSON.stringify({
            product: {
                id: el.target.parentNode.dataset.product_id, 
                count: input.value
            }
        }),
        headers: {
            'Accept' : 'application/json',
            'Content-Type' : 'application/json'
        }
    }).then((res) => {
        return res.json();
    }).then((res) => {
        el.target.innerText = res.buttonText;
        let messageWrap = document.createElement('div');
            messageWrap.className = 'message-wrap';
        let message = document.createElement('div');
            message.className = 'message';
            message.innerText = res.message;
        
        if(res.tooMuch) {
            document.querySelector('.quantity__input').style.color = 'rgb(255, 78, 78)';
            document.querySelector('.in_stock').style.color = 'rgb(255, 78, 78)';
            setTimeout(() => { 
                document.querySelector('.quantity__input').style.color = 'inherit';
                document.querySelector('.in_stock').style.color = 'inherit';
                recalculation();
            }, 500);
        }

        messageWrap.append(message);
        document.querySelector('body').append(messageWrap);

        setTimeout(() => {
            document.querySelector('.message-wrap').remove();
        }, 2000);
    });
});

/** Пересчет Итого */
function recalculation() {
    if(input.value !== '0')
        total.innerText = Math.round(((input.value !== '') ? input.value : 1) * productData.price * 100) / 100;
    else if (input.value === '0') {
        total.innerText = Math.round(1 * productData.price * 100) / 100;
        input.value = 1;
    }
}