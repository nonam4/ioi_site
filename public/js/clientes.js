const selecionarClientes = () => {
  if(tela != "clientes") {
    tela = "clientes"
    document.getElementById("listagem").innerHTML = ""
    mostrarLoad(document.body)
    setTimeout(() => {
      listagem(false)
    }, 500)
  }
}

const listagemClientes = () => {

  var interfaces = new DocumentFragment()
  clientes.forEach((cliente, index) => {
    cliente.index = index
    var interface = document.getElementById("tCliente").content.cloneNode(true)
    interface.querySelector("#expandir").onclick = () => {expandirCliente(cliente)}
    interface.querySelector("#excluir").onclick = () => {excluirCliente(cliente)}
    interface.querySelector(".cliente").id = cliente.id
    interface.querySelector("#nome").innerHTML = cliente.nomefantasia
    interface.querySelector("#chave").innerHTML = "Chave do cliente: " + cliente.id
    interfaces.appendChild(interface)
  })
  document.getElementById("listagem").appendChild(interfaces)
}

const expandirCliente = (cliente) => {
  var layout = document.getElementById("tClienteExpandido").content.cloneNode(true)
  layout.querySelector("#salvar").onclick = () => {salvarCliente(cliente)}

  if(cliente != undefined) {
    layout.querySelector("clienteExpandido").id = cliente.index
    preencherCliente(cliente, layout)
  }
  if(tela != "leituras") {
    layout.querySelector("#printers").style.display = "block"
  }
  document.body.appendChild(layout)

  $("#celular").mask("(00) 00000-0000")
	$("#telefone").mask("(00) 0000-0000")
	$("#cep").mask("00000-000")
  $("#numero").mask("0000000")
  $("#estado").mask("AA")

  var options = {
    onKeyPress: (cpf, ev, el, op) => {
      var masks = ['000.000.000-000', '00.000.000/0000-00']
      $('#cpfcnpj').mask((cpf.length > 14) ? masks[1] : masks[0], op)
    }
  }
  $('#cpfcnpj').length > 11 ? $('#cpfcnpj').mask('00.000.000/0000-00', options) : $('#cpfcnpj').mask('000.000.000-00#', options)

  setTimeout(() => {
    document.getElementById("clienteExpandido").style.opacity = "1"
  }, 50)
}

const excluirCliente = (cliente) => {
  if(confirm("Deseja desativar o cliente? Isso NÂO vai excluir os dados!")) {
    cliente.ativo = false
    gravarCliente(cliente)
  }
}

const preencherCliente = (cliente, layout) => {

  layout.querySelector("#razaosocial").value = toTitleCase(cliente.razaosocial)
  layout.querySelector("#nomefantasia").value = toTitleCase(cliente.nomefantasia)
  layout.querySelector("#cpfcnpj").value = cliente.cpfcnpj
  layout.querySelector("#email").value = cliente.contato.email
  layout.querySelector("#telefone").value = cliente.contato.telefone
  layout.querySelector("#celular").value = cliente.contato.celular
  layout.querySelector("#endereco").value = toTitleCase(cliente.endereco.rua)
  layout.querySelector("#numero").value = cliente.endereco.numero
  layout.querySelector("#bairro").value = toTitleCase(cliente.endereco.bairro)
  layout.querySelector("#cidade").value = toTitleCase(cliente.endereco.cidade)
  layout.querySelector("#estado").value = cliente.endereco.estado
  layout.querySelector("#cep").value = cliente.endereco.cep
  layout.querySelector("#complemento").value = cliente.endereco.complemento

  layout.querySelector("#printers").onclick = () => {
    if(cliente.impressoras != undefined && Object.keys(cliente.impressoras).length > 0) {
      fecharCliente()
      selecionarLeituras()
      setTimeout(() => {
        expandirLeitura(cliente)
      }, 350)
    } else {
      error("Cliente não tem nenhuma impressora para listar!")
    }
  }
}

const salvarCliente = (cliente) => {

  var ok = true
  var layout = document.getElementById("clienteExpandido")

  if(layout.querySelector("#razaosocial").value == "") {
    ok = false
    layout.querySelector("#razaosocial").reportValidity()
  } else if(layout.querySelector("#nomefantasia").value == "") {
    ok = false
    layout.querySelector("#nomefantasia").reportValidity()
  } else if(layout.querySelector("#telefone").value == "") {
    if(layout.querySelector("#celular").value == ""){
      ok = false
      layout.querySelector("#telefone").reportValidity()
    }
  } else if(layout.querySelector("#endereco").value == "") {
    ok = false
    layout.querySelector("#endereco").reportValidity()
  } else if(layout.querySelector("#numero").value == "") {
    ok = false
    layout.querySelector("#numero").reportValidity()
  } else if(layout.querySelector("#cidade").value == "") {
    ok = false
    layout.querySelector("#cidade").reportValidity()
  } else if(layout.querySelector("#estado").value == "") {
    ok = false
    layout.querySelector("#estado").reportValidity()
  }

  if(ok) {
    if(cliente == undefined) {
      var data = new Date()
      cliente = new Object()
      cliente.contato = new Object()
      cliente.endereco = new Object()
      cliente.id = data.getTime() + ""
      cliente.ativo = true
      cliente.franquia = {
        tipo: "ilimitado",
        valor: 0
      }
      cliente.sistema = {
        local: btoa("Não Instalado"),
        versao: "Não Instalado"
      }
      var index = clientes.length
      clientes.push(cliente)
    }

    cliente.nomefantasia = toTitleCase(layout.querySelector("#nomefantasia").value)
    cliente.razaosocial = toTitleCase(layout.querySelector("#razaosocial").value)
    cliente.contato.telefone = layout.querySelector("#telefone").value
    cliente.contato.celular = layout.querySelector("#celular").value
    cliente.contato.email = layout.querySelector("#email").value.toLowerCase()
    cliente.cpfcnpj = layout.querySelector("#cpfcnpj").value

    cliente.endereco.rua = toTitleCase(layout.querySelector("#endereco").value)
    cliente.endereco.numero = layout.querySelector("#numero").value
    cliente.endereco.bairro = toTitleCase(layout.querySelector("#bairro").value)
    cliente.endereco.cidade = toTitleCase(layout.querySelector("#cidade").value)
    cliente.endereco.estado = layout.querySelector("#estado").value
    cliente.endereco.cep = layout.querySelector("#cep").value
    cliente.endereco.complemento = layout.querySelector("#complemento").value
  /*
    cliente.horarios = {
      domingo: {fechado: true},
      segunda: {fechado: true},
      terca: {fechado: true},
      quarta: {fechado: true},
      quinta: {fechado: true},
      sexta: {fechado: true},
      sabado: {fechado: true},
    }
  */
    gravarCliente(cliente)
  }
}

const gravarCliente = (cliente) => {

  var index = cliente.index
  //deleta os dados locais que não precisam serem salvos no DB
  delete cliente.excedentes
  delete cliente.impresso
  delete cliente.index

  if(cliente.franquia.tipo == "maquina" || cliente.franquia.tipo == "ilimitado") {
    cliente.franquia.valor = 0
  }

  var impressoras = cliente.impressoras
  if(impressoras != undefined && Object.keys(impressoras).length > 0) {
    delete cliente.impressoras.atraso
    delete cliente.impressoras.inativas
    for(var x = 0; x < Object.keys(impressoras).length; x++) {
      var impressora = impressoras[Object.keys(impressoras)[x]]
      //deleta os dados locais que não precisam serem salvos no DB
      delete impressora.excedentes
      delete impressora.impresso
      delete impressora.serial
      if(cliente.franquia.tipo != "maquina") {
        impressora.franquia = 0
      }
    }
  }

  feedbacks++
  feedback(true)
  fecharCliente()
  var usuario = JSON.parse(localStorage.getItem('usuario'))
  axios.request('https://us-central1-ioi-printers.cloudfunctions.net/gravarCliente', {
    params: {
      usuario: usuario.usuario,
      senha: usuario.senha,
      cliente: JSON.stringify(cliente)
    }
  }).then(res => {
    feedbacks--
    feedback(false)
    if(tela == "clientes") {
      document.getElementById("listagem").innerHTML = ""
      mostrarLoad(document.body)
      setTimeout(() => {
        listagem(false)
      }, 500)
    }
  }).catch(err => {
    feedbacks--
    console.error(err)
    error("Erro ao gravar os dados. Recarregue a página e tente novamente!")
  })
}

const toTitleCase = (str) => {
  return str.toLowerCase().replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const fecharCliente = () => {
  var clienteExpandido = document.getElementById("clienteExpandido")
  clienteExpandido.style.opacity = "0"
  setTimeout(() => {
    clienteExpandido.remove()
  }, 250)
}
