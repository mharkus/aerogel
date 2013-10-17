function createGauge(name, label, min, max)
            {
                var config = 
                {
                    size: 120,
                    label: label,
                    min: undefined != min ? min : 0,
                    max: undefined != max ? max : 100,
                    minorTicks: 5
                }
                
                var range = config.max - config.min;
                config.yellowZones = [{ from: config.min + range*0.75, to: config.min + range*0.9 }];
                config.redZones = [{ from: config.min + range*0.9, to: config.max }];
                
                gauges[name] = new Gauge("gaugeContainer", config);
                gauges[name].render();
            }
