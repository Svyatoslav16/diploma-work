const selectBox = document.getElementsByClassName('select-box');

for (let i = 0; i < selectBox.length; i++) {
  const selected = selectBox[i].getElementsByClassName("selected");
  const optionsContainer = selectBox[i].getElementsByClassName("options-container");
  const optionsList = selectBox[i].getElementsByClassName("option");
  
  for (let j = 0; j < selected.length; j++) {
    selected[j].addEventListener("click", () => {     
      optionsContainer[0].classList.toggle("active");
    });
  }

  for (let k = 0; k < optionsList.length; k++) {
    optionsList[k].addEventListener("click", () => {
      optionsList[k].children[0].checked = 'true';
      selected[0].innerHTML = optionsList[k].children[1].innerHTML;
      optionsContainer[0].classList.remove("active");
    });
  }
}
