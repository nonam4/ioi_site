//limpa tudo, cria os filtros e lista de atendimentos do zero
const selecionarAtendimentos = () => {
  if(tela != 'atendimentos') {
    tela = 'atendimentos'
    document.getElementById('listagem').innerHTML = ''
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

      } else if(atendimento.responsavel == '') {
      
        atAberto[atendimento.id] = atendimento

      } else {
        for(var y = 0; y < Object.keys(usuarios).length; y++) {
          var usuario = usuarios[Object.keys(usuarios)[y]]
      
          if(atendimento.responsavel == usuario.nome) {
            atendimento.tecnico = usuario
            usuario.atendimentos[atendimento.id] = atendimento
          }
        }
      }
    }
  }
  
  var container = document.getElementById('tAtendimentosContainer').content.cloneNode(true)

  for(var y = 0; y < Object.keys(atAberto).length; y++) {
    var atendimento = atAberto[Object.keys(atAberto)[y]]

    container.querySelector('#abertos').appendChild(criarInterfaceAtendimento(atendimento))
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

      if(container.querySelector('#' + usuario.usuario) == null) {
        var layout = document.createElement('pessoasContainer')
        layout.innerHTML = "<div class='pessoasTitulo ordem'>" + usuario.nome + 
                        "</div><div class='pessoasListagem tec' id='" + usuario.usuario + "'></div>"
  
        container.querySelector('.pessoasContainer').appendChild(layout)
        Sortable.create(container.querySelector('#' + usuario.usuario), {animation: 150})
      }
      container.querySelector('#' + usuario.usuario).appendChild(criarInterfaceAtendimento(atendimento))
    }
  }
 
  var feitos = document.createElement('pessoasContainer')
  feitos.innerHTML = "<div class='pessoasTitulo'>Feitos</div><div class='pessoasListagem' id='feitos'></div>"

  for(var y = 0; y < Object.keys(atFeitos).length; y++) {
    var atendimento = atFeitos[Object.keys(atFeitos)[y]]   

    feitos.querySelector('#feitos').appendChild(criarInterfaceAtendimento(atendimento))
  }

  container.querySelector('.pessoasContainer').appendChild(feitos)
  document.getElementById('listagem').appendChild(container)
}

const criarInterfaceAtendimento = atendimento => {
  var interface = document.getElementById('tAtendimento').content.cloneNode(true)
  interface.querySelector('atendimento').id = atendimento.id
  
  if(atendimento.feito){
    interface.querySelector('#concluido').className = 'fas fa-file-times red'
  }

  interface.querySelector('#expandir').onclick = (atendimento => {
    return () => {expandirAtendimento(atendimento)}
  })(atendimento)

  interface.querySelector('#concluido').onclick = (atendimento => {
    return () => {
      
      atendimento.feito = true
      console.log(atendimento)
      var atendimentos = {}
      atendimentos[atendimento.id] = atendimento
      console.log(atendimentos)
      //gravarAtendimentos(atendimentos)
    }
  })(atendimento)

  if(atendimento.feito) {
    var data = atendimento.datas.fim.split('-')
    interface.querySelector('#data').innerHTML = '<span>Feito em</span>' + data[2] + '/' + data[1] + '/' + data[0]
  } else {
    var data = atendimento.datas.inicio.split('-')
    interface.querySelector('#data').innerHTML = '<span>Início</span>' + data[2] + '/' + data[1] + '/' + data[0]
  }

  interface.querySelector('#cliente').innerHTML = '<span>Cliente</span>' + atendimento.dados.nomefantasia
  interface.querySelector('#cidade').innerHTML = '<span>Cidade</span>' + atendimento.dados.endereco.cidade
  
  var motivo = ''
  atendimento.motivo.forEach((el, index) => {
    if(index < atendimento.motivo.length - 1) {
      motivo = motivo + el + ' - '
    } else {
      motivo = motivo + el
    }
  })
  interface.querySelector('#motivo').innerHTML = '<span>Motivo</span>' + motivo

  //determina se o sistema já pode gravar a ordem dos atendimentos 
  //ou se o usuario continua editando
  var timeout
  //quando começar o drag'n'drop limpa o timeout e espera mais 5s para tentar gravar
  interface.querySelector('atendimento').ondragstart = (timeout => {
    return () => {clearTimeout(timeout)}
  })(timeout)


  interface.querySelector('atendimento').ondragend = (timeout => {
    return () => {timeout = setTimeout(() => {
      if(tela == 'atendimentos') {
        salvarOrdemAtendimentos(atendimento.tecnico)
      } else {
        feedbacks--
        error('As alterações na ordem dos atendimentos foram perdidas por mudança de tela. Tente novamente!')
      }
    }, 5000)}
  })(timeout)

  return interface
}

const salvarOrdemAtendimentos = responsavel => {

  var container = document.body.querySelector('#' + responsavel.usuario).children
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

const gravarAtendimentos = atendimentos => {
  console.log(atendimentos)
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
    if(tela == 'atendimentos') {
      document.getElementById('listagem').innerHTML = ''
      setTimeout(() => {
        listagem(false)
      }, 300)
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error('Erro ao gravar os dados. Recarregue a página e tente novamente!')
  })
}

const expandirAtendimento = atendimento => {

  var layout = document.getElementById('tAtendimentoExpandido').content.cloneNode(true)
  layout.querySelector('#salvar').onclick = () => {salvarAtendimento(atendimento)}

  var nomes = layout.querySelector('#cliente')
  autoCompleteClientes(nomes)

  var tecnicos = layout.querySelector('#responsavel')
  for(var x = 0; x < Object.keys(usuarios).length; x++) {
    var usuario = usuarios[Object.keys(usuarios)[x]]

    var option = document.createElement('option')
    option.value = usuario.nome
    option.innerHTML = usuario.nome
    tecnicos.appendChild(option)
  }

  var adicionarMotivo = document.getElementById('tAtendimentoAdicionar').content.cloneNode(true)
  if(atendimento != undefined) {
    layout.querySelector('#nome').innerHTML = 'Editar Atendimento'
    layout.querySelector('atendimentoExpandido').id = atendimento.id

    preencherAtendimento(atendimento, layout)
  } else {

    layout.querySelector('#nome').innerHTML = 'Novo Atendimento'
    var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
    autoCompleteMotivos(motivo.querySelector('.motivo-texto'))
    layout.querySelector('.motivo-list').appendChild(motivo)
  }

  layout.querySelector('.motivo-list').appendChild(adicionarMotivo)

  document.body.appendChild(layout)
  setTimeout(() => {
    document.getElementById('atendimentoExpandido').style.opacity = '1'
  }, 50)
}

const fecharAtendimento = () => {
  var atendimentoExpandido = document.getElementById('atendimentoExpandido')
  atendimentoExpandido.style.opacity = '0'
    setTimeout(() => {
      atendimentoExpandido.remove()
    }, 200)
}

/*
* funções dos autocompletes
*/
const autoCompleteClientes = input => {
  /* precisa de dois parâmetros: o input de textos e o array de clientes */
	var currentFocus
	/* adiciona um listener quando for digitado alguma coisa */
	input.addEventListener('input', function(e) {
  
    var a, b, i, val = this.value
    closeAllLists()
    
	  if (!val) { return false }
    currentFocus = -1

	  a = document.createElement('DIV')
	  a.setAttribute('id', this.id + 'autocomplete-list')
	  a.setAttribute('class', 'autocomplete')
    this.parentNode.appendChild(a)
    
    for(var x = 0; x < Object.keys(clientes).length; x++) {
      var cliente = clientes[Object.keys(clientes)[x]]

      /* checa as letras compativeis no nome fantasia */
      if (cliente.nomefantasia.toLowerCase().indexOf( val.toLowerCase() ) > -1 
          || cliente.razaosocial.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
        
        /* cria uma div para cada item que tenha correspondencia */
        b = document.createElement('DIV')
        if (cliente.nomefantasia.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
          /* faz as letras coincidentes em negrito */
          b.innerHTML = cliente.nomefantasia
        } else if (cliente.razaosocial.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
          /* faz as letras coincidentes em negrito */
          b.innerHTML = cliente.razaosocial
        }

        /* cria um input invisivel que vai segurar o valor do item */
        b.innerHTML += "<input type='hidden' value='" + cliente.id + "'>"
        /* executa a função quando for clicado na div do item */
        b.addEventListener('click', function(e) {
          //quando clicar em um item do autocomplete, define o valor
          input.value = clientes[this.getElementsByTagName('input')[0].value].nomefantasia
          mostrarDadosCliente(clientes[this.getElementsByTagName('input')[0].value], input)
          closeAllLists()
        })
        a.appendChild(b)
      }
	  }
  })
  
  const closeAllLists = elmnt => {
    /* fecha todas as listas do documento, exceto a passada como argumento */
      
    var x = document.querySelectorAll('.autocomplete')
    x.forEach(el => {
      if (elmnt != el && elmnt != input) {
        el.parentNode.removeChild(el)
      }
    })
  }
    
	/* executa a função quando alguem clicar fora da lista */
	document.addEventListener('click', e => {
	  closeAllLists(e.target)
	})
}

const autoCompleteMotivos = input => {
  /* precisa de dois parâmetros: o input de textos e o array de clientes */
	var currentFocus
	/* adiciona um listener quando for digitado alguma coisa */
	input.addEventListener('input', function(e) {
  
    var a, b, i, val = this.value
    closeAllLists()
    
	  if (!val) { return false }
    currentFocus = -1

	  a = document.createElement('DIV')
	  a.setAttribute('id', this.id + 'autocomplete-list')
	  a.setAttribute('class', 'autocomplete')
    this.parentNode.appendChild(a)
    
    for(var x = 0; x < Object.keys(suprimentos).length; x++) {
      var suprimento = suprimentos[Object.keys(suprimentos)[x]]

      /* checa as letras compativeis no nome fantasia */
      if (suprimento.modelo.toLowerCase().indexOf( val.toLowerCase() ) > -1) {
        /* cria uma div para cada item que tenha correspondencia */
        b = document.createElement('DIV')
        b.innerHTML = suprimento.modelo + ' - Em estoque: ' + suprimento.quantidade + ' unidades'
        /* cria um input invisivel que vai segurar o valor do item */
        b.innerHTML += "<input type='hidden' value='" + suprimento.id + "'>"
        /* executa a função quando for clicado na div do item */
        b.addEventListener('click', function(e) {
          //quando clicar em um item do autocomplete, define o valor
          input.value = suprimentos[this.getElementsByTagName('input')[0].value].modelo
          mostrarQuantidades(input, suprimentos[this.getElementsByTagName('input')[0].value], true)
          closeAllLists()
        })
        a.appendChild(b)
      }
	  }
  })
  
  const closeAllLists = elmnt => {
    /* fecha todas as listas do documento, exceto a passada como argumento */
      
    var x = document.querySelectorAll('.autocomplete')
    x.forEach(el => {
      if (elmnt != el && elmnt != input) {
        el.parentNode.removeChild(el)
      }
    })
  }

	/* executa a função quando alguem clicar fora da lista */
	document.addEventListener('click', e => {
	  closeAllLists(e.target)
	})
}
/*
* fim das funções dos autocompletes
*/

const preencherAtendimento = (atendimento, layout) => {

  layout.querySelector('#cliente').value = clientes[atendimento.cliente].nomefantasia
  mostrarDadosCliente(clientes[atendimento.cliente], layout.querySelector('#cliente'))

  var responsavel = layout.querySelector('#responsavel')
  for(var x = 0; x < responsavel.length; x++){
    if(atendimento.responsavel == responsavel.options[x].value) {
      responsavel.options[x].selected = true
    }
  }

  var status = layout.querySelector('#status')
  if(atendimento.status != 'Feito'){
    status.options[0].selected = true
  } else {
    status.options[1].selected = true
  }

  $('.motivo-quantidade').mask('000')
  atendimento.motivo.forEach(motivo => {
    var el = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)

    if(motivo.indexOf('Quantidade:') > 0) {
      
      var modelo = motivo.split(' - Quantidade: ')[0]
      var quantidade = parseInt(motivo.split(' - Quantidade: ')[1])
      var suprimento = suprimentoPorModelo(modelo)

      el.querySelector('.motivo-texto').value = modelo
      el.querySelector('.motivo-texto').onclick = element => {element.path[0].blur()}
      el.querySelector('.motivo-quantidade').value = quantidade
      el.querySelector('.motivo-quantidade').onclick = element => {element.path[0].blur()}
      mostrarQuantidades(el.querySelector('.motivo-texto'), suprimento, false)
    } else {
      el.querySelector('.motivo-texto').value = motivo
    }

    autoCompleteMotivos(el.querySelector('.motivo-texto'))
    layout.querySelector('.motivo-list').appendChild(el)
  })
}

const suprimentoPorModelo = modelo => {
  for(var x = 0; x < Object.keys(suprimentos).length; x++) {
    var suprimento = suprimentos[Object.keys(suprimentos)[x]]

    if(suprimento.modelo == modelo) {
      return suprimento
    }
  }
}

const clientePorNome = nome => {
  for(var x = 0; x < Object.keys(clientes).length; x++) {
    var cliente = clientes[Object.keys(clientes)[x]]

    if(cliente.nomefantasia == nome || cliente.razaosocial == nome) {
      return cliente
    }
  }
}

const mostrarQuantidades = (el, suprimento, alterarQuantidade) => {
  var container = el.parentNode.parentNode
  var quantidade = container.querySelector('.quantidade')
  quantidade.style.width = '100px'
  quantidade.style.marginLeft = '8px'
  quantidade.style.marginRight = '8px'
  quantidade.style.opacity = '1'
  
  var input = quantidade.querySelector('.motivo-quantidade')
  if(parseInt(input.value) > parseInt(suprimento.quantidade) && alterarQuantidade) {
    input.value = suprimento.quantidade
  }
  input.max = suprimento.quantidade

  if(suprimento.quantidade == 0) {
    input.min = 0
  }
}

const adicionarMotivo = el => {
  var motivo = document.getElementById('tAtendimentoMotivo').content.cloneNode(true)
  var container = motivo.querySelector('.motivo')
  autoCompleteMotivos(motivo.querySelector('.motivo-texto'))
  container.style.opacity = '0'
  $(motivo).insertBefore(el.parentNode)
  setTimeout(() => {
    container.style.opacity = '1'
  }, 50)
}

const mostrarDadosCliente = (cliente, input) => {

  var container = input.parentNode.parentNode.parentNode.parentNode
  var dados = container.querySelector('#dados')
  var editClient = container.querySelector('#editCliente')

  dados.querySelector('#endereco').innerHTML = cliente.endereco.rua + ', ' + cliente.endereco.numero + ', ' + cliente.endereco.cidade

  if(cliente.contato.telefone != '' && cliente.contato.celular != '') {
    dados.querySelector('#telefone').innerHTML = cliente.contato.telefone + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + cliente.contato.celular
  } else if(cliente.contato.telefone == '' && cliente.contato.celular != '') {
    dados.querySelector('#telefone').innerHTML = cliente.contato.celular
  } else if(cliente.contato.telefone != '' && cliente.contato.celular == ''){
    dados.querySelector('#telefone').innerHTML = cliente.contato.telefone
  }

  editClient.style.minWidth = '20px'
  editClient.style.maxWidth = '20px'
  editClient.style.maxHeight = '20px'
  editClient.style.opacity = '1'
  editClient.onclick = () => { 
    fecharAtendimento()
    setTimeout(() => {
      expandirCliente(cliente)
    }, 50) 
  }

  dados.querySelector('#chave').innerHTML = 'Chave: ' + cliente.id + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Local inst.: ' + atob(cliente.sistema.local) + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Versão: ' + cliente.sistema.versao
    
  dados.style.height = 'fit-content'
  dados.style.opacity = '1'
}

const salvarAtendimento = atendimento => {
  var layout = document.body.querySelector('atendimentoExpandido')
  var cliente = clientePorNome(layout.querySelector('#cliente').value)
  var motivos = layout.querySelectorAll('.motivo-texto')
  var erro = false
  //só vai baixar do estoque se for um atendimento novo ou se a quantidade for diferente
  var editando = true

  var data = new Date()
  var ano = data.getFullYear()
  var mes = data.getMonth() + 1
  if (mes < 10) { mes = "0" + mes }
  var dia = data.getDate()
  if (dia < 10) { dia = "0" + dia }

  if(atendimento == undefined) {
    editando = false
    atendimento = new Object()
    atendimento.id = data.getTime() + ''

    if(layout.querySelector('#status').value == "Aberto") {
      atendimento.feito = false
      atendimento.datas = {
        inicio: ano + '-' + mes + '-' + dia
      }
    }
    atendimento.ordem = 0
  }

  if(cliente == undefined) {
    error('Cliente inválido ou não cadastrado!')
    erro = true
  } else {
    atendimento.cliente = cliente.id
  }
  
  if(!erro) {
    for(var x = 0; x < Object.keys(atendimentos).length; x++) {
      var at = atendimentos[Object.keys(atendimentos)[x]]
      
      if(at.cliente == atendimento.cliente && (at.responsavel == '' 
        || at.responsavel == layout.querySelector('#responsavel').value) 
        && !at.feito && at.id != atendimento.id) {

        error('Já existe um atendimento em aberto para esse cliente!')
        erro = true
        break
      }
    }
  }
  
  if(!erro) {
    for(var x = 0; x < motivos.length; x++) {
      var motivo = motivos[x]
  
      if(motivo.value == '' && motivos.length < 2) {
        error('Motivo muito curto ou vazio!')
        erro = true
        break
      }
    }
  }

  if(!erro) {
    atendimento.motivo = []
    for(var x = 0; x < motivos.length; x++) {
      var motivo = motivos[x]
      var suprimento = suprimentoPorModelo(motivo.value)

      if(suprimento != undefined) {
        //caso o motivo seja um toner ou suprimento
        var quantidade = motivo.parentNode.parentNode.querySelector('.motivo-quantidade')
        atendimento.motivo.push(suprimento.modelo + ' - Quantidade: ' + quantidade.value)
        if(!editando) { suprimento.quantidade = suprimento.quantidade - quantidade.value }

      } else if(motivo.value != '') {

        atendimento.motivo.push(motivo.value)
      }
    }

    atendimento.responsavel = layout.querySelector('#responsavel').value
    if(layout.querySelector('#status').value == "Feito") {
      atendimento.feito = true
      atendimento.datas = {
        inicio: atendimento.datas.inicio,
        fim: ano + '-' + mes + '-' + dia
      }
    }

    fecharAtendimento()
    atendimentos[atendimento.id] = atendimento
    
    delete atendimento.dados
    delete atendimento.tecnico
    gravarAtendimentos({[atendimento.id]: atendimento})
  }
}