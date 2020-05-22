let workerList = document.getElementsByClassName('worker');
let topToolBar = document.getElementsByClassName('top-toolbar')[0];
let bottomToolBar = document.getElementsByClassName('bottom-toolbar')[0];

for (let i = 0; i < workerList.length; i++) {
  workerList[i].addEventListener('click', function() {
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
  let selectedCount = document.getElementsByClassName('worker active').length;
  if(selectedCount >= 1)
    selectedSpan.innerText = selectedCount;
  for (let i = 0; i < workerList.length; i++) {
    if(!workerList[i].classList.contains('active')) {
      if(i === workerList.length - 1) {
        topToolBar.classList.remove('active');
        bottomToolBar.classList.remove('active');
      } 
    } else {
      break;
    }
  }
}

document.getElementsByClassName('select-all-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < workerList.length; i++) {
    if(!workerList[i].classList.contains('active')) {
      workerList[i].classList.add('active');
      selected();
      blockedPencil();
    }
  }
});

document.getElementsByClassName('cross-white-icon')[0].addEventListener('click', function() {
  for (let i = 0; i < workerList.length; i++) {
    if(workerList[i].classList.contains('active')) {
      workerList[i].classList.remove('active');
      topToolBar.classList.remove('active');
      bottomToolBar.classList.remove('active');
    }
  }
});

document.getElementsByClassName('bottom-toolbar__trash-icon')[0].addEventListener('click', function() {
  let workerID = [];
  for (let i = 0; i < workerList.length; i++) {
    if(workerList[i].classList.contains('active')) {
        workerID.push(workerList[i].dataset.worker_id);
    }    
  }
  deleteByID(workerID);
});

document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].addEventListener('click', function() {
  window.location.href = `${window.location.origin}/editWorkerProfile?workerId=${document.getElementsByClassName('worker active')[0].dataset.worker_id}`;
});

document.querySelectorAll('.trash-icon').forEach(el => {
  el.addEventListener('click', () => {
    deleteByID(el.dataset.worker_id);
  });
});


function deleteByID(workerID) {
    console.log(workerID);
  fetch('/deleteWorkerByID', {
    method: 'POST',
    body: JSON.stringify({workerID}),
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
      if(workerID.length === 1) {
        for (let i = 0; i < workerList.length; i++) {
          if(workerList[i].dataset.worker_id === workerID[0]) {
            workerList[i].remove();
            message.innerText = 'Сотрудник успешно удален';
          }
        }
      } else if(workerID.length > 1) {
        for (let i = 0; i < workerID.length; i++) {
          for (let j = 0; j < workerList.length; j++) {
            if(workerID[i] === workerList[j].dataset.worker_id) {
              workerList[j].remove();
              message.innerText = 'Сотрудники успешно удалены';
            }            
          }          
        }
      }
    } else {
      message.innerText = res.error;
    }

    messageWrap.append(message);
    document.querySelector('body').append(messageWrap);
    workerList = document.getElementsByClassName('worker');
    topToolBar.classList.remove('active');
    bottomToolBar.classList.remove('active');

    setTimeout(() => {
      document.querySelector('.message-wrap').remove();
    }, 2000);
  });
}

function blockedPencil() {
  let workerActive = 0;
  let pencilIconClassList = document.getElementsByClassName('bottom-toolbar__pencil-icon')[0].classList;

  for (let i = 0; i < workerList.length; i++) {
    if(workerList[i].classList.contains('active')) {
        workerActive++;
    }    
  }

  if(workerActive > 1) {
    if(!pencilIconClassList.contains('blocked')) {
      pencilIconClassList.add('blocked');
    }
  } else {
    if(pencilIconClassList.contains('blocked')) {
      pencilIconClassList.remove('blocked');
    }
  }
}