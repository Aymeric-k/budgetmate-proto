const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE');
const validateE = document.querySelector('#validateE');

const listEntry = document.querySelector('#listEntry')





function transformInputIntoP(element,value, index){
    const p = document.createElement('p');
    p.dataset.index = index;
    p.classList.add('writing','entree');
    p.textContent= value;
    
    element.parentNode.replaceChild(p,element);
    
}
let listEntryLength = listEntry.children.length


function createFormInput(index, type, element){
    element.innerHTML+= `
    <form id="addElement" action="" method="">
    <fieldset>
    <label for="nom">Nom de l'ajout</label>
    <input type="text" name"nom" id"nom" placeholder="Optionnel" data-index="${index-1}">
    </fieldset>
    <fieldset>
    <label for="montant">Montant</label>
    <input type="number" name="montant" id="montant" placeholder="Montant exact" data-index="${index-1}" class="${type}">
    </fieldset>
    <button> Ajouter </button>
    </form>
    `
}
createFormInput(listEntryLength, "entree", listEntry)
// entree.addEventListener('keydown', (e)=>{
//     if (e.key==='Enter'){
        
//         transformInputIntoP(entree,entree.value,entree.dataset.index)
//     }
// })