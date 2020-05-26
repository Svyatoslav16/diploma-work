let categoryList = document.getElementsByClassName('category');
let topToolBar = document.getElementsByClassName('top-toolbar')[0];
let bottomToolBar = document.getElementsByClassName('bottom-toolbar')[0];

for (let i = 0; i < categoryList.length; i++) {
  categoryList[i].addEventListener('click', function() {
    if(screen.width < 900) {
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
  let selectedCount = document.getElementsByClassName('category active').length;
  if(selectedCount >= 1)
    selectedSpan.innerText = selectedCount;
  for (let i = 0; i < categoryList.length; i++) {
    if(!categoryList[i].classList.contains('active')) {
      if(i === categoryList.length - 1) {
        topToolBar.classList.remove('active');
        bottomToolBar.classList.remove('active');
      } 
    } else {
      break;
    }
  }
}

document.getElementsByClassName('select-all-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < categoryList.length; i++) {
    if(!categoryList[i].classList.contains('active')) {
      categoryList[i].classList.add('active');
      selected();
      blockedPencil();
    }
  }
});

document.getElementsByClassName('cross-white-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < categoryList.length; i++) {
    if(categoryList[i].classList.contains('active')) {
      categoryList[i].classList.remove('active');
      topToolBar.classList.remove('active');
      bottomToolBar.classList.remove('active');
    }
  }
});

document.getElementsByClassName('bottom-toolbar__trash-icon')[0].addEventListener('click', function() {
  let categoryID = [];
  for (let i = 0; i < categoryList.length; i++) {
    if(categoryList[i].classList.contains('active')) {
        categoryID.push(categoryList[i].dataset.id);
    }
  }
  deleteByID(categoryID);
});

document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].addEventListener('click', function() {
  window.location.href = `${window.location.origin}/editCategory?categoryID=${document.getElementsByClassName('category active')[0].dataset.id}`;
});

document.querySelectorAll('.trash-icon').forEach(el => {
  el.addEventListener('click', () => {
    deleteByID([el.dataset.id]);
  });
});


function deleteByID(categoryID) {
  fetch('/deleteCategoryByID', {
    method: 'POST',
    body: JSON.stringify({categoryID}),
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
      if(categoryID.length === 1) {
        if(res.message !== 'В категории присутствуют товары') {
          for (let i = 0; i < categoryList.length; i++) {
            if(categoryList[i].dataset.id === categoryID[0]) {
                categoryList[i].remove();
            }
          }
        }
      } else if(categoryID.length > 1) {
        if(res.message != 'В одной из категорий присутствуют товары') {
          for (let i = 0; i < categoryList.length; i++) {
            for (let j = 0; j < categoryList.length; j++) {
              if(categoryID[i] === categoryList[j].dataset.id) {
                categoryList[j].remove();
              }            
            }          
          }
        }
      }

      message.innerText = res.message;
    } else {
      message.innerText = res.error;
    }

    messageWrap.append(message);
    document.querySelector('body').append(messageWrap);
    categoryList = document.getElementsByClassName('category');
    topToolBar.classList.remove('active');
    bottomToolBar.classList.remove('active');

    setTimeout(() => {
      document.querySelector('.message-wrap').remove();
    }, 2000);
  });
}

function blockedPencil() {
  let categoryActive = 0;
  let pencilIconClassList = document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].classList;

  for (let i = 0; i < categoryList.length; i++) {
    if(categoryList[i].classList.contains('active')) {
      categoryActive++;
    }    
  }

  if(categoryActive > 1) {
    if(!pencilIconClassList.contains('blocked')) {
      pencilIconClassList.add('blocked');
    }
  } else {
    if(pencilIconClassList.contains('blocked')) {
      pencilIconClassList.remove('blocked');
    }
  }
}