let productList = document.getElementsByClassName('product');
let topToolBar = document.getElementsByClassName('top-toolbar')[0];
let bottomToolBar = document.getElementsByClassName('bottom-toolbar')[0];

for (let i = 0; i < productList.length; i++) {
  productList[i].addEventListener('click', function() {
    if(screen.width < 700) {
      this.classList.toggle('active');
      if (!topToolBar.classList.contains('active') &&
          !bottomToolBar.classList.contains('active')) {
        topToolBar.classList.add('active');
        bottomToolBar.classList.add('active');
      }
      selected();
      blockedPencil();
    }
  });
}

function selected() {
  let selectedSpan = document.getElementsByClassName('selected-count')[0];
  let selectedCount = document.getElementsByClassName('product active').length;
  if(selectedCount >= 1)
    selectedSpan.innerText = selectedCount;
  for (let i = 0; i < productList.length; i++) {
    if(!productList[i].classList.contains('active')) {
      if(i === productList.length - 1) {
        topToolBar.classList.remove('active');
        bottomToolBar.classList.remove('active');
      } 
    } else {
      break;
    }
  }
}

document.getElementsByClassName('select-all-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < productList.length; i++) {
    if(!productList[i].classList.contains('active')) {
      productList[i].classList.add('active');
      selected();
      blockedPencil();
    }
  }
});

document.getElementsByClassName('cross-white-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < productList.length; i++) {
    if(productList[i].classList.contains('active')) {
      productList[i].classList.remove('active');
      topToolBar.classList.remove('active');
      bottomToolBar.classList.remove('active');
    }
  }
});

document.getElementsByClassName('bottom-toolbar__trash-icon')[0].addEventListener('click', function() {
  let productID = [];
  for (let i = 0; i < productList.length; i++) {
    if(productList[i].classList.contains('active')) {
      productID.push(productList[i].dataset.product_id);
    }    
  }
  deleteByID(productID);
});

document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].addEventListener('click', function() {
  window.location.href = `${window.location.origin}/editProductProperties?productId=${document.getElementsByClassName('product active')[0].dataset.product_id}`;
});

document.querySelectorAll('.trash-icon').forEach(el => {
  el.addEventListener('click', () => {
    deleteByID(el.dataset.product_id);
  });
});


function deleteByID(productID) {
  fetch('/deleteProductByID', {
    method: 'POST',
    body: JSON.stringify({productID: productID}),
    headers: {
        'Accept' : 'application/json',
        'Content-Type' : 'application/json'
    }
  }).then(res => {
    return res.json();
  }).then(res => {
    let messageWrap = document.createElement('div');
        messageWrap.className = 'message-wrap';
    let message = document.createElement('div');
        message.className = 'message';
        
    if(!res.err) {
      if(productID.length === 1) {
        for (let i = 0; i < productList.length; i++) {
          if(productList[i].dataset.product_id === productID[0]) {
            productList[i].remove();
            message.innerText = 'Товар успешно удален';
          }
        }
      } else if(productID.length > 1) {
        for (let i = 0; i < productID.length; i++) {
          for (let j = 0; j < productList.length; j++) {
            if(productID[i] === productList[j].dataset.product_id) {
              productList[j].remove();
              message.innerText = 'Товары успешно удалены';
            }            
          }          
        }
      }
    } else {
      message.innerText = res.error;
    }

    messageWrap.append(message);
    document.querySelector('body').append(messageWrap);
    productList = document.getElementsByClassName('product');
    topToolBar.classList.remove('active');
    bottomToolBar.classList.remove('active');

    setTimeout(() => {
      document.querySelector('.message-wrap').remove();
    }, 2000);
  });
}

function blockedPencil() {
  let productActive = 0;
  let pencilIconClassList = document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].classList;

  for (let i = 0; i < productList.length; i++) {
    if(productList[i].classList.contains('active')) {
      productActive++;
    }    
  }

  if(productActive > 1) {
    if(!pencilIconClassList.contains('blocked')) {
      pencilIconClassList.add('blocked');
    }
  } else {
    if(pencilIconClassList.contains('blocked')) {
      pencilIconClassList.remove('blocked');
    }
  }
}