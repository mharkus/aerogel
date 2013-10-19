var socket;             
                
            var gauges = [];


            
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


function drawFlightPanel(){
  var canvas = document.getElementById('footerbg');
      var context = canvas.getContext('2d');
      var x = canvas.width / 2;
      var y = canvas.height + 20;
      var radius = 160;
      var startAngle = 1 * Math.PI;
      var endAngle = 2 * Math.PI;
      var counterClockwise = false;

      var lingrad = context.createLinearGradient(0,0,0,380);
      lingrad.addColorStop(0, 'rgba(44,44,44,1)');
      lingrad.addColorStop(0.3, 'rgba(11,11,11,0.9)');
      lingrad.addColorStop(1, 'rgba(0,0,0,0.3)');

      context.fillStyle = "rgba(255, 255, 255, 0.5)";
      context.beginPath();
      context.arc(x, y, radius, startAngle, endAngle, counterClockwise);
      context.fillStyle = lingrad;
      context.fill();
    context.lineWidth = 2;
      context.strokeStyle = '#000';
      context.stroke();

}

function connectToServer(){
  socket = io.connect('http://localhost');
      socket.on('stabilizer', function (data) {
            var pitch = data.pitch * Math.PI / 180;
            var roll = data.roll * Math.PI / 180;
            var yaw = data.yaw * Math.PI / 180;
            gauges["thrust"].redraw((data.thrust/65535) * 100);
      });

      socket.on('accelerometer', function (data) {
            $('#accx').html(formatDecimal(data.x));
            $('#accy').html(formatDecimal(data.y));
            $('#accz').html(formatDecimal(data.z));
      });

      socket.on('gyro', function (data) {
          if(data){
            $('#gyrox').html(formatDecimal(data.x));
            $('#gyroy').html(formatDecimal(data.y));
            $('#gyroz').html(formatDecimal(data.z));
          }
      });

      socket.on('battery', function (data) {
        $('#batteryLevel').val((data.level * 1000 - 2974)/(4153 - 2974) * 100);
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

function formatDecimal(val){
  return Math.round(val * 100) / 100;
}
