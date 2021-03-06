var {dense, rnn, conv} = require('./topo.js')
var $ = require('./utils.js')
const tf = $.tf

var mnist = require('./data.js') 

//  training variables
var batch_size = 256
var epochas = 13 * 8 
var sample_count = 10000 // using 10k training samples
var input_shape = [batch_size,784]
var test_count = 10000

// 3 layer basic convolution (size is kernal, depth is number of filters)
var convo = conv({input_shape, layers:[{size: [1, 1], depth:64, activation: 'relu'}, {size: [3,3], depth: 32}, {size: [9,9], depth: 1, activation: 'relu'}]})

// layers for the dense network
var encode_layers = [{size: 256 * 4}, {size: 10, activation: 'linear'}]

// dense encoder
var encoder = dense({input_shape, layers: encode_layers})

var rate = .0061
var optimizer = tf.train.adam(rate)

// run it
load_and_run()

async function load_and_run(){
  await mnist.loadData()
  train()
  test()
}

function feed_fwd(input, train, size){

  var conv = convo.flow(input, train)

  // flatten for dense layers
  conv = conv.reshape([size || batch_size, input_shape[1]])

  var encoding = encoder.flow(conv, train) 
  
  return {encoding}
}

function train(batch){
  var batch = []
  var labels = []
  for(var x = 0; x < sample_count / batch_size; x++){
    var d = mnist.nextTrainBatch(batch_size)
    batch.push(d.image)
    labels.push(d.label)
  }

  for(var x = 0; x < epochas; x++){
    tf.tidy(() => {
      var _loss = $.scalar(0)
      var dispose = []
      batch.forEach((input, i) => {
        _loss = _loss.add(optimizer.minimize(function(){
          let {encoding} = feed_fwd(input, true)
          //let reg = encoder.regularize().add(convo.regularize())
          let encodeLoss = tf.mean(tf.losses.softmaxCrossEntropy(labels[i], encoding))
          if(i % 10 == 0){ // print loss every ith train
            //console.log('***************************************************************')
            //console.log(`current encode loss is: ${tf.mean(encodeLoss).dataSync()}`)
           // encoding.print()
           
          } 
          // garbage collection 
          $.dispose([encodeLoss, encoding])

          return encodeLoss
        }, true))
      })

      //console.log(`\ntf memory is ${JSON.stringify(tf.memory())}`)
      console.log(`average loss after epoch ${(x+1)}:`)
      console.log(_loss.div($.scalar(batch.length)).dataSync()[0] + '\n')
      
      mnist.resetTraining()
      $.dispose(dispose, true)
    })
  }
}

function test(input){

  var batch = []
  var labels = []
  mnist.resetTest()
  var correct = 0
  var wrong = 0
  for(var x = 0; x < test_count; x++){
    var d = mnist.nextTestBatch(1)
    batch.push(d.image)
    labels.push(d.label) 
  }
  console.log('\n***************************  TESTING  ************************************\n')
  
  batch.forEach((input, i) => {
    tf.tidy(()=>{
    var {encoding} = feed_fwd(input, false, 1)
    let loss = tf.losses.softmaxCrossEntropy(labels[i], encoding)
    let p = tf.argMax(encoding, 1).dataSync()[0]
    let a = tf.argMax(labels[i], 1).dataSync()[0]
    if(p==a) correct++
    else wrong++
//    let m = `precidicted: ${p} \nactual: ${a}\nloss:${(tf.mean(loss).dataSync()[0])}` 
//    console.log(m)
  //  encoding.print()
  //  labels[i].print()
  //  tf.mean(loss).print()
  })
  })
  console.log(`correct: ${correct}, wrong: ${wrong}, percentage: ${(correct/(correct+wrong)*100)}`)
  console.log('\n\n\n')
}

