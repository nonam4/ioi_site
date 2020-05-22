//limpa tudo, cria os filtros e lista de atendimentos do zero
const selecionarAtendimentos = () => {
  if(tela != "atendimentos") {
    tela = "atendimentos"
    document.getElementById("listagem").innerHTML = ""
    listagem(false)
  }
}

const listagemAtendimentos = () => {
  var atFeitos = {}
  var atAberto = {}
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]
    usuario.atendimentos = {}
  }
 
  for(var x = 0; x < Object.keys(atendimentos).length; x++) {
    var atendimento = atendimentos[Object.keys(atendimentos)[x]]
    atendimento.dados = clientes[atendimento.cliente]

    if(atendimento.dados != undefined) {
      if(atendimento.feito) {
    
        atFeitos[atendimento.id] = atendimento

      } else if(atendimento.responsavel == "") {
      
        atAberto[atendimento.id] = atendimento
      }
                       
      for(var y = 0; y < Object.keys(usuarios).length; y++) {
        var usuario = usuarios[Object.keys(usuarios)[y]]
    
        if(atendimento.responsavel == usuario.nome) {
          atendimento.tecnico = usuario
          usuario.atendimentos[atendimento.id] = atendimento
        }
      }
    }
  }
  
  var container = document.getElementById("tAtendimentosContainer").content.cloneNode(true)

  for(var y = 0; y < Object.keys(atAberto).length; y++) {
    var atendimento = atAberto[Object.keys(atAberto)[y]]

    container.querySelector("#abertos").appendChild(criarInterfaceChamado(atendimento))
  }
 
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]
    var ordered = {}

    Object.keys(usuario.atendimentos).sort((a, b) => {
      return usuario.atendimentos[a].ordem - usuario.atendimentos[b].ordem
    }).forEach(key => {
      ordered[key] = usuario.atendimentos[key]
    })
    usuario.atendimentos = ordered

    for(var y = 0; y < Object.keys(usuario.atendimentos).length; y++) {
      var atendimento = usuario.atendimentos[Object.keys(usuario.atendimentos)[y]]

      if(container.querySelector("#" + usuario.usuario) == null) {
        var layout = document.createElement("pessoasContainer")
        layout.innerHTML = "<div class='pessoasTitulo ordem'>" + usuario.nome + 
                        "</div><div class='pessoasListagem tec' id='" + usuario.usuario + "'></div>"
  
        container.querySelector(".pessoasContainer").appendChild(layout)
        Sortable.create(container.querySelector("#" + usuario.usuario), {animation: 150})
      }
      container.querySelector("#" + usuario.usuario).appendChild(criarInterfaceChamado(atendimento))
    }
  }
 
  var feitos = document.createElement("pessoasContainer")
  feitos.innerHTML = "<div class='pessoasTitulo'>Feitos</div><div class='pessoasListagem' id='feitos'></div>"

  for(var y = 0; y < Object.keys(atFeitos).length; y++) {
    var atendimento = atFeitos[Object.keys(atFeitos)[y]]   

    feitos.querySelector("#feitos").appendChild(criarInterfaceChamado(atendimento))
  }

  container.querySelector(".pessoasContainer").appendChild(feitos)
  document.getElementById("listagem").appendChild(container)
}

//determina se o sistema já pode gravar a ordem dos atendimentos 
//ou se o usuario continua editando
var timeout
const criarInterfaceChamado = (atendimento) => {
  var interface = document.getElementById("tAtendimento").content.cloneNode(true)
  interface.querySelector("atendimento").id = atendimento.id
  if(atendimento.feito){
    interface.querySelector("atendimento").className.add("atendido")
  }

  if(atendimento.feito) {
    var data = atendimento.datas.fim.split("-")
    interface.querySelector("#data").innerHTML = "<span>Feito em</span>" + data[2] + "/" + data[1] + "/" + data[0]
  } else {
    var data = atendimento.datas.inicio.split("-")
    interface.querySelector("#data").innerHTML = "<span>Início</span>" + data[2] + "/" + data[1] + "/" + data[0]
  }

  interface.querySelector("#cliente").innerHTML = "<span>Cliente</span>" + atendimento.dados.nomefantasia
  interface.querySelector("#cidade").innerHTML = "<span>Cidade</span>" + atendimento.dados.endereco.cidade
  
  var motivo = ""
  atendimento.motivo.forEach((el, index) => {
    if(index < atendimento.motivo.length - 1) {
      motivo = motivo + el + " - "
    } else {
      motivo = motivo + el
    }
  })
  interface.querySelector("#motivo").innerHTML = "<span>Motivo</span>" + motivo


  //quando começar o drag'n'drop limpa o timeout e espera mais 5s para tentar gravar
  interface.querySelector("atendimento").ondragstart = () => {
    clearTimeout(timeout)
  }

  interface.querySelector("atendimento").ondragend = () => {
    timeout = setTimeout(function(){
      if(tela == "atendimentos") {
        salvarOrdemAtendimentos(atendimento.tecnico)
      } else {
        feedbacks--
        error("As alterações na ordem dos atendimentos foram perdidas por mudança de tela. Tente novamente!")
      }
    }, 5000)
  }

  return interface
}

const salvarOrdemAtendimentos = (responsavel) => {

  var container = document.body.querySelector("#" + responsavel.usuario).children
  if(container.length > 1) {

    for(var x = 0; x < container.length; x++) {
      var el = container[x]
  
      var atendimento = responsavel.atendimentos[el.id]
      atendimento.ordem = x + 1

      delete atendimento.dados
      delete atendimento.tecnico
    }
    gravarAtendimentos(responsavel.atendimentos)
  }
}

const gravarAtendimentos = (atendimentos) => {

  feedbacks++
  feedback(true)
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarAtendimentos', {
    params: {
      usuario: usuario.usuario,
      senha: usuario.senha,
      atendimentos: JSON.stringify(atendimentos)
    }
  }).then(res => {
    feedbacks--
    feedback(false)
  }).catch(err => {
    feedbacks--
    console.error(err)
    error("Erro ao gravar os dados. Recarregue a página e tente novamente!")
  })
}











/*
* altera a listagem dos chamados
*/
//limpa tudo, cria os filtros e lista as leituras do zero
const selecionarListagemChamados = () => {

  telaAtiva = "chamados";
  document.getElementById("listagem").innerHTML = "";
  mostarLoadParcial();
  setTimeout(() => {
    preparaListagens();
  }, 500);
}

//limpa os chamados e lista de acordo com os filtros
const alterarListagemChamados = () => {

  document.querySelectorAll('.chamado').forEach(function(a){
    a.remove();
  });

  mostarLoadParcial();
  setTimeout(() => {
    preparaListagens(false);
  }, 500);
}

const alterarTipoChamado = (element) => {
  var layout = element.parentNode.parentNode.parentNode;
  var tipo = element.options[element.selectedIndex].value;

  if(tipo == "manutencao") {
    layout.querySelector("#tipoSuprimento").style.opacity = "0";
    setTimeout(() => {
      layout.querySelector("#tipoManutencao").style.display = "block";
      setTimeout(() => {
        layout.querySelector("#tipoManutencao").style.opacity = "1";
      }, 10);
      layout.querySelector("#tipoSuprimento").style.display = "none";
    }, 200);
  } else if(tipo == "suprimento") {
    layout.querySelector("#tipoManutencao").style.opacity = "0";
    setTimeout(() => {
      layout.querySelector("#tipoSuprimento").style.display = "block";
      setTimeout(() => {
        layout.querySelector("#tipoSuprimento").style.opacity = "1";
      }, 10);
      layout.querySelector("#tipoManutencao").style.display = "none";
    }, 200);
  }
}

const expandirChamado = (editando, element) => {

  var layout = document.getElementById("tChamadoExpandido").content.cloneNode(true);
  var nomes = layout.querySelector("#cliente");
  autoCompleteClienteChamado(nomes, clientes);

  var tecnicosSelect = layout.querySelector("#responsavel");
  tecnicos.forEach((tecnico) => {
    var option = document.createElement("option");
    option.value = tecnico.nome;
    option.innerHTML = tecnico.nome;
    tecnicosSelect.appendChild(option);
  });

  if(editando) {
    preencherChamado(element.parentNode.id, layout);
    mostrarDadosCliente(nomes.value, nomes);

    layout.querySelector("chamadoexpandido").id = element.parentNode.id;
  }

  document.body.appendChild(layout);
  setTimeout(() => {
    document.getElementById("chamadoExpandido").style.opacity = "1";
  }, 10);
}

const autoCompleteClienteChamado = (inp, arr) => {
	  /*the autocomplete function takes two arguments,
	  the text field element and an array of possible autocompleted values:*/
	  var currentFocus;
	  /*execute a function when someone writes in the text field:*/
	  inp.addEventListener("input", function(e) {
	      var a, b, i, val = this.value;
	      /*close any already open lists of autocompleted values*/
	      closeAllLists();
	      if (!val) { return false;}
	      currentFocus = -1;
	      /*create a DIV element that will contain the items (values):*/
	      a = document.createElement("DIV");
	      a.setAttribute("id", this.id + "autocomplete-list");
	      a.setAttribute("class", "autocomplete");
	      /*append the DIV element as a child of the autocomplete container:*/
	      this.parentNode.appendChild(a);
	      /*for each item in the array...*/
	      for (i = 0; i < arr.length; i++) {
	        /*check if the item starts with the same letters as the text field value:*/
	        if (arr[i].nome.toLowerCase().indexOf(val.toLowerCase()) > -1) {
	          /*create a DIV element for each matching element:*/
	          b = document.createElement("DIV");
	          /*make the matching letters bold:*/
	          b.innerHTML = arr[i].nome.substr(0, val.length);
	          b.innerHTML += arr[i].nome.substr(val.length);
	          /*insert a input field that will hold the current array item's value:*/
	          b.innerHTML += "<input type='hidden' value='" + arr[i].nome + "'>";
	          /*execute a function when someone clicks on the item value (DIV element):*/
	              b.addEventListener("click", function(e) {
	            	  //quando clicar em um item do autocomplete, define o valor
	            	  inp.value = this.getElementsByTagName("input")[0].value;
	            	  mostrarDadosCliente(this.getElementsByTagName("input")[0].value, inp);
		              closeAllLists();
	          });
	          a.appendChild(b);
	        }
	      }
	  });
	  /*execute a function presses a key on the keyboard:*/
	  inp.addEventListener("keydown", function(e) {
	      var x = document.getElementById(this.id + "autocomplete-list");
	      if (x) x = x.getElementsByTagName("div");
	      if (e.keyCode == 40) {
	        /*If the arrow DOWN key is pressed,
	        increase the currentFocus variable:*/
	        currentFocus++;
	        /*and and make the current item more visible:*/
	        addActive(x);
	      } else if (e.keyCode == 38) { //up
	        /*If the arrow UP key is pressed,
	        decrease the currentFocus variable:*/
	        currentFocus--;
	        /*and and make the current item more visible:*/
	        addActive(x);
	      } else if (e.keyCode == 13) {
	        /*If the ENTER key is pressed, prevent the form from being submitted,*/
	        e.preventDefault();
	        if (currentFocus > -1) {
	          /*and simulate a click on the "active" item:*/
	          if (x) x[currentFocus].click();
	        }
	      }
	  });
	  function addActive(x) {
	    /*a function to classify an item as "active":*/
	    if (!x) return false;
	    /*start by removing the "active" class on all items:*/
	    removeActive(x);
	    if (currentFocus >= x.length) currentFocus = 0;
	    if (currentFocus < 0) currentFocus = (x.length - 1);
	    /*add class "autocomplete-active":*/
	    x[currentFocus].classList.add("autocomplete-active");
	  }
	  function removeActive(x) {
	    /*a function to remove the "active" class from all autocomplete items:*/
	    for (var i = 0; i < x.length; i++) {
	      x[i].classList.remove("autocomplete-active");
	    }
	  }
	  function closeAllLists(elmnt) {
	    /*close all autocomplete lists in the document,
	    except the one passed as an argument:*/
	    var x = document.getElementsByClassName("autocomplete");
	    for (var i = 0; i < x.length; i++) {
	      if (elmnt != x[i] && elmnt != inp) {
	      x[i].parentNode.removeChild(x[i]);
	    }
	  }
	}
	/*execute a function when someone clicks in the document:*/
	document.addEventListener("click", function (e) {
	    closeAllLists(e.target);
	});
}

const mostrarDadosCliente = (nome, input) => {

  var container = input.parentNode.parentNode.parentNode.parentNode;
  var dados = container.querySelector("#dados");
  var editClient = container.querySelector("#editCliente");

  clientes.forEach((cliente) => {

    if(cliente.nome == nome) {
        dados.querySelector("#endereco").innerHTML = cliente.endereco.rua + ", " + cliente.endereco.numero + ", " + cliente.endereco.cidade;

        if(cliente.telefone != "" && cliente.celular != "") {
          dados.querySelector("#telefone").innerHTML = cliente.telefone + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + cliente.celular;
        } else if(cliente.telefone == "" && cliente.celular != "") {
          dados.querySelector("#telefone").innerHTML = cliente.celular;
        } else if(cliente.telefone != "" && cliente.celular == ""){
          dados.querySelector("#telefone").innerHTML = cliente.telefone;
        }

        editClient.style.minWidth = "20px !important";
        editClient.style.maxWidth = "20px";
        editClient.style.opacity = "1";
        editClient.onclick = () => {acharClienteDoChamado(cliente.id)};

        dados.querySelector("#chave").innerHTML = "Chave: " + cliente.id + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Local inst.: " + cliente.localColetorInstalado + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Versão: " + cliente.versaoColetor;
    }
  });

  dados.style.height = "fit-content";
  dados.style.opacity = "1";
}

const preencherChamado = (id, layout) => {

  chamados.forEach((chamado) => {
    if(chamado.id == id) {

      layout.querySelector("#cliente").value = chamado.cliente;

      var responsavel = layout.querySelector("#responsavel");
      for(var x = 0; x < responsavel.length; x++){
        if(chamado.responsavel == responsavel.options[x].value){
          responsavel.options[x].selected = true;
        }
      }

      var setor = layout.querySelector("#setor");
      if(chamado.setor == "locacao"){
        setor.options[0].selected = true;
      } else if(chamado.setor == "ti"){
        setor.options[1].selected = true;
      }

      var status = layout.querySelector("#status");
      if(chamado.status != "Feito"){
        status.options[0].selected = true;
      } else {
        status.options[1].selected = true;
      }

      /*
      var tipo = layout.querySelector("#tipo");
      tipo.disabled = true;
      if(chamado.tipo == "manutencao"){
        tipo.options[0].selected = true;
      } else {
        tipo.options[1].selected = true;
        layout.querySelector("#motivo").disabled = true;
      }
      */

      layout.querySelector("#motivo").value = chamado.motivo;
    }
  })
}

const fecharChamadoExpandido = () => {
  var chamadoExpandido = document.getElementById("chamadoExpandido");
    chamadoExpandido.style.opacity = "0";
    setTimeout(() => {
      chamadoExpandido.remove();
    }, 200);
}

const adicionarSuprimentoNaLista = (element) => {

  var container = element.parentNode;
  var layout = document.getElementById("tSuprimento").content.cloneNode(true);

  var suprimentoSelect = layout.querySelector("#suprimento");
  suprimentos.forEach((suprimento) => {
    if(suprimento.quantidade > 0) {
      var option = document.createElement("option");
      option.value = suprimento.modelo;
      option.innerHTML = suprimento.modelo;
      suprimentoSelect.appendChild(option);
    }
  });

  container.appendChild(layout);
  setTimeout(() => {
    container.children[container.children.length - 2].style.opacity = "1";
  }, 10);

  container.appendChild(element);
}

const removerSuprimentoDaLista = (element) => {
  var layout = element.parentNode;
  var container = layout.parentNode;

  layout.style.opacity = "0";

  setTimeout(() => {
    container.removeChild(layout);
  }, 200);
}

const alterarTipoSuprimento = (element) => {

  var container = element.parentNode.parentNode;
  var maximo;
  suprimentos.forEach((suprimento) => {
    if(suprimento.modelo == element.value) {
      maximo = suprimento.quantidade;
    }
  });

  var quantidade = container.querySelector("#quantidade");
  quantidade.max = maximo;
}

const salvarChamado = (element) => {

  var container = element.parentNode.parentNode.parentNode;

  //se ja existir um chamado aberto para esse cliente o sistema não vai deixar abrir um novo
  var chamadoExiste = false;

  chamados.forEach((chamado) => {
    if(chamado.cliente == container.querySelector("#cliente").value && chamado.status != "Feito" && chamado.setor == container.querySelector("#setor").value) { //&& container.querySelector("#tipo").value == chamado.tipo) {
      chamadoExiste = true;
    }
  });
  if(!chamadoExiste || container.id != "") {
    if(container.id != "") {
      salvarChamadoEditado(container);
    } else {
      salvarNovoChamado(container);
    }
  } else {
   alert("Já existe um chamado em aberto para esse cliente");
  }
}

const salvarNovoChamado = (element) => {

  var data = new Date();
  var dia = data.getDate();
  (dia < 10) ? dia = "0" + dia :0;
  var hora = data.getHours();
  (hora < 10) ? hora = "0" + hora :0;
  var minutos = data.getMinutes();
  (minutos < 10) ? minutos = "0" + minutos :0;

  var chamado = new Object();
  chamado.id = data.getTime() + "";
  chamado.index = chamados.length;
  chamado.horaInicio = dia+"-"+mes+"-"+ano+" - "+hora+":"+minutos;
  chamado.horaFinal = chamado.horaInicio;
  chamado.cliente = element.querySelector("#cliente").value;
  chamado.responsavel = element.querySelector("#responsavel").value;
  chamado.setor = element.querySelector("#setor").value;
  chamado.status = element.querySelector("#status").value;
  //chamado.tipo = element.querySelector("#tipo").value;
  chamado.tipo = "manutencao";
  chamado.motivo = "";

  var clienteExiste = false;
  clientes.forEach((cliente) => {
    if(cliente.nome == chamado.cliente){

      clienteExiste = true;
      chamado.endereco = cliente.endereco;
      chamado.telefone = cliente.telefone;
      chamado.celular = cliente.celular;
    }
  });

  if(!clienteExiste) {
    element.querySelector("#cliente").reportValidity();
    alert("Selecione um cliente válido");
  } else {

    if(element.querySelector("#motivo").value != "") {
      chamado.motivo = element.querySelector("#motivo").value;
      gravarChamado(chamado);
      chamados.push(chamado);
    } else {
      element.querySelector("#motivo").reportValidity();
    }


    /*
    if(chamado.tipo == "manutencao") {
      if(element.querySelector("#motivo").value != "") {
        chamado.motivo = element.querySelector("#motivo").value;
        gravarChamado(chamado);
        chamados.push(chamado);
      } else {
        element.querySelector("#motivo").reportValidity();
      }
    } else if(chamado.tipo == "suprimento") {

      var sups = element.querySelector("#tipoSuprimento");
      if(sups.children.length > 1) {

        sups.querySelectorAll('.suprimentoHolder').forEach(function(sup){
          if(sup.querySelector("#suprimento").value != ""){

            chamado.motivo = chamado.motivo + sup.querySelector("#suprimento").value + " - Quantidade: " + sup.querySelector("#quantidade").value + "\n";

            suprimentos.forEach((suprimento) => {
              if(suprimento.modelo == sup.querySelector("#suprimento").value) {

                suprimento.quantidade = suprimento.quantidade - sup.querySelector("#quantidade").value;
                gravarEstoque(suprimento);
              }
            });
          } else {
            alert("Existem suprimentos inválidos");
          }
        });
        chamados.push(chamado);
        gravarChamado(chamado);
      } else {
        alert("Adicione algum suprimento na lista");
      }
    }
    */
  }
}

const salvarChamadoEditado = (element) => {

  chamados.forEach((chamado) => {

    if(chamado.id == element.id.replace(/c/g, "")) {

      chamado.cliente = element.querySelector("#cliente").value;
      chamado.responsavel = element.querySelector("#responsavel").value;
      chamado.setor = element.querySelector("#setor").value;
      chamado.status = element.querySelector("#status").value;
      //chamado.tipo = element.querySelector("#tipo").value;
      chamado.tipo = "manutencao";
      chamado.motivo = element.querySelector("#motivo").value;

      var clienteExiste = false;
      clientes.forEach((cliente) => {
        if(cliente.nome == chamado.cliente){

          clienteExiste = true;
          chamado.endereco = cliente.endereco;
          chamado.telefone = cliente.telefone;
          chamado.celular = cliente.celular;
        }
      });

      if(!clienteExiste) {
        element.querySelector("#cliente").reportValidity();
        alert("Selecione um cliente válido");
      } else {
        if(element.querySelector("#motivo").value != "") {
          chamado.motivo = element.querySelector("#motivo").value;
          gravarChamado(chamado);
        } else {
          element.querySelector("#motivo").reportValidity();
        }
      }
    }
  })
}

const gravarChamado = (chamado) => {

  feedbacksRestantes++;
  mostrarFeedbackTrabalhos();
  const funcao = firebase.functions().httpsCallable('gravarChamados');
  funcao(chamado).then(function(result) {
    feedbacksRestantes--;
    buscarChamados();
    mostrarFeedbackConcluido();
  }).catch(function(error) {
    console.error("Erro chamando a função 'gravarChamado'", error);
  });
  fecharChamadoExpandido();
  if(telaAtiva == "chamados") {
    alterarListagemChamados();
  }
}

const acharClienteDoChamado = (id) => {

  //fecharChamadoExpandido();
  expandirCliente(true, id, false, true);
}
