var socket;             
                
            var gauges = [];

                    // revolutions per second
            var angularSpeed = 0.2; 
            var lastTime = 0;
            var camera, scene, plane, renderer;

            
            function createGauge(name, label, min, max, size)
            {
                var config = 
                {
                    size: undefined != size ? size : 150,
                    label: label,
                    min: undefined != min ? min : 0,
                    max: undefined != max ? max : 100,
                    minorTicks: 5
                }
                
                var range = config.max - config.min;
                //config.yellowZones = [{ from: config.min + range*0.75, to: config.min + range*0.9 }];
                config.redZones = [{ from: config.min + range*0.9, to: config.max }];
                
                gauges[name] = new Gauge(name, config);
                gauges[name].render();
            }
            
            function createGauges()
            {
                createGauge("motor1", "Motor 1");
                createGauge("motor2", "Motor 2");
                createGauge("motor3", "Motor 3");
                createGauge("motor4", "Motor 4");
                createGauge("thrust", "Thrust", undefined, undefined, 328);
            }
            
            function updateGauges()
            {
                for (var key in gauges)
                {
                    var value = getRandomValue(gauges[key])
                    gauges[key].redraw(value);
                }
            }
            
            function getRandomValue(gauge)
            {
                var overflow = 0; //10;
                return gauge.config.min - overflow + (gauge.config.max - gauge.config.min + overflow*2) *  Math.random();
            }
            
            function initialize()
            {
                createGauges();
                //draw3D();
            }

            function startCF(){
                socket.emit('command', { action: 'start' });
            }

            function stopCF(){
                socket.emit('command', { action: 'stop' });
            }
            

 
              // this function is executed on each animation frame
              function animate(){
                // update
                var time = (new Date()).getTime();
                var timeDiff = time - lastTime;
                var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
                
                cube.rotation.x += angleChange;
                lastTime = time;
         
                // render
                renderer.render(scene, camera);
         
                // request new frame
                requestAnimationFrame(function(){
                    animate();
                });
              }

           function draw3D(){
                // renderer
              renderer = new THREE.WebGLRenderer();
              renderer.setSize(400, 350);
              document.getElementById('stabilizer3D').appendChild(renderer.domElement);
         
              // camera
              camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
              camera.position.y = 150;
              camera.position.z = 500;
              //camera.rotation.x = 45 * (Math.PI / 180);
         
              // scene
              scene = new THREE.Scene();
                
             var geometry = new THREE.CubeGeometry( 200, 200, 10 );
             var colors = ["0xff0000", "0xff0000", "0x00ffe4", "0x00ffe4", "0xfcff00", "0xfcff00", "0x0006ff", "0x0006ff", "0x46a145", "0x46a145", "0xff5a00", "0xff5a00"];

                for ( var i = 0; i < geometry.faces.length; i ++ ) {
                    geometry.faces[ i ].color.setHex(colors[i]);
                }

               var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );

              cube = new THREE.Mesh( geometry, material );
              cube.position.y = 150;
              cube.position.x = -150;



              scene.add(cube);

              renderer.render( scene, camera ); 
              //animate();
           }   

           function plot(){
                nv.addGraph(function() {
                  chart = nv.models.lineChart()
                  .options({
                    margin: {left: 100, bottom: 100},
                    x: function(d,i) { return i},
                    showXAxis: true,
                    showYAxis: true,
                    transitionDuration: 250
                  });

                // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
                chart.xAxis
                .axisLabel("Time (s)")
                .tickFormat(d3.format(',.1f'));

              chart.yAxis
                .axisLabel('Voltage (v)')
                .tickFormat(d3.format(',.2f'))
                ;

              d3.select('#plot svg')
                .datum(sinAndCos())
                .call(chart);

              //TODO: Figure out a good way to do this automatically
              nv.utils.windowResize(chart.update);
              //nv.utils.windowResize(function() { d3.select('#chart1 svg').call(chart) });

              chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

              return chart;
            }); 
          }
           

        function sinAndCos() {
          var sin = [],
            cos = [],
            rand = [],
            rand2 = []
            ;

          for (var i = 0; i < 100; i++) {
            sin.push({x: i, y: i % 10 == 5 ? null : Math.sin(i/10) }); //the nulls are to show how defined works
            cos.push({x: i, y: .5 * Math.cos(i/10)});
            rand.push({x:i, y: Math.random() / 10});
            rand2.push({x: i, y: Math.cos(i/10) + Math.random() / 10 })
          }

          return [
            {
              area: true,
              values: sin,
              key: "Sine Wave",
              color: "#ff7f0e"
            },
            {
              values: cos,
              key: "Cosine Wave",
              color: "#2ca02c"
            },
            {
              values: rand,
              key: "Random Points",
              color: "#2222ff"
            }
            ,
            {
              values: rand2,
              key: "Random Cosine",
              color: "#667711"
            }
          ];
        }


function connectToServer(){
  socket = io.connect('http://localhost');
      socket.on('stabilizer', function (data) {
        //var pitch = data.pitch * 180 / Math.PI;
        //var roll = data.roll * 180 / Math.PI;
        //var yaw = data.yaw * 180 / Math.PI;

        var pitch = data.pitch * Math.PI / 180;
        var roll = data.roll * Math.PI / 180;
        var yaw = data.yaw * Math.PI / 180;
        

        //cube.rotation.x = pitch + 270 * (Math.PI / 180);
        //cube.rotation.y = roll;
        //cube.rotation.z = yaw;  

        if(renderer){
          renderer.render( scene, camera ); 
        } 


        gauges["thrust"].redraw((data.thrust/65535) * 100);
      });

      socket.on('accelerometer', function (data) {
        
      });

      socket.on('gyro', function (data) {
        
        
      });

      socket.on('battery', function (data) {
        $('#batteryLevel').val((data.level * 1000 - 2974)/(4153 - 2974) * 100);
        console.log((data.level * 1000 - 2974)/(4153 - 2974));
        console.log(data.level);
      });

      socket.on('end', function (data) {
        gauges["motor1"].redraw(0);
        gauges["motor2"].redraw(0);
        gauges["motor3"].redraw(0);
        gauges["motor4"].redraw(0);
        gauges["thrust"].redraw(0);

        $('#button').toggleClass('on');
        
      });

      socket.on('motor', function (data) {
        gauges["motor1"].redraw((data.m1/65535) * 100);
        gauges["motor2"].redraw((data.m2/65535) * 100);
        gauges["motor3"].redraw((data.m3/65535) * 100);
        gauges["motor4"].redraw((data.m4/65535) * 100);

      });
}
