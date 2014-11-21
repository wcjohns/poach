var temperature_data = [];


var trunk = {};
trunk.width = 320;
trunk.height = 150;
trunk.left = 35;
trunk.right = 10;
trunk.xax_count = 5;


var update_d3_chart = null;
var lineData = [];
var nminutes_to_show = 5;

function update_metric_chart() {
  if( lineData.length < 3 )
    return;

  var data = most_resent_data( lineData, nminutes_to_show*60*1000 );

  var yMin = function(){ return d3.min(data, function(d){ return Math.min(d.y); }); };
  var yMax = function(){ return d3.max(data, function(d){ return Math.max(d.y); }); };
  var xMax = function(){ return d3.max(data, function(d){ return Math.max(d.x); }); };
  var xMin = function(){ return d3.min(data, function(d){ return Math.max(d.x); }); };


  //update data
  data_graphic({
    title: "Temperature of the Water",
    description: "Some Description.",
    data: data,
    width: trunk.width*2,
    height: trunk.height,
    right: trunk.right,
    area: false,
    show_years: false,
    transition_on_update: true,
    xax_count: 5,
    target: '#modify_time_period',
    x_accessor: 'x',
    y_accessor: 'y',
    max_x: xMax(),
    max_y: yMax(),
    min_x: xMin(),
    min_y: yMin(),
    xax_format: d3.time.format('%H:%M:%S'),
    animate_on_load: true
  })
}

function most_resent_data(data, nmiliseconds)
{
  var answer = [];
  if( data.length < 1 )
    return answer;

  if( nmiliseconds <= 0 )
    return data;

  var mostrecent = data[data.length-1].x;

  for(var i=0; i<data.length; i++) {
    if( (mostrecent - data[i].x) < nmiliseconds )
      answer.push( data[i] );
  }

  return answer;
}


function InitMetricChart()
{
  trunk.right = 20;
  trunk.width = 0.5*0.8333*$(document).width() - 2*trunk.right - 2*trunk.left;
  trunk.height = 250; //0.25*$(document).height();

  assignEventListeners();

  update_metric_chart();

  function assignEventListeners() {

    $('.modify-time-period-controls button').click(function() {
      nminutes_to_show = $(this).data('time_period');
      $(this).addClass('active')
          .siblings()
          .removeClass('active');
      update_metric_chart();
      if( update_d3_chart )
        update_d3_chart();
    })
  }
}//function InitMetricChart()




function InitDataStream()
{
  if (!!window.EventSource) {
    var source = new EventSource('/');
    source.onmessage = function(e) {
      var d = $("#data");

      var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

      try
      {
        var obj = jQuery.parseJSON(e.data);

        obj.forEach(function(d){
          var newel = { 'x': iso.parse(d.x), 'y': parseFloat(d.y) };
          temperature_data.push(newel);
        });
      }catch(e)
      {
        console.log( 'caught: ' + e );
        return;
      }

      lineData = temperature_data;

      if( d.text().indexOf("nothing received") > -1 )
        d.text("");
      else
        d.append("<br>" + e.data);

      update_metric_chart();
      if( update_d3_chart )
        update_d3_chart();
    }
  }
}//function InitDataStream()

var timeToDisplayString = function(d){
  //return ;
  var e = new Date(d);
  var h = e.getHours();
  var m = e.getMinutes();
  var s = e.getSeconds();
  return "" + (h<10?"0":"") + h + ":"+ (m<10?"0":"") + m + ":"+ (s<10?"0":"") + s;
};


function InitUpdatingChart()
{
  var vis = d3.select("#tempdata");
  var graph = vis.append("svg:svg");

  var WIDTH = 0.8333*$(document).width();
  var HEIGHT = 250;
  var MARGINS = { top: 20, right: 20, bottom: 20, left: 50};

  var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");

  var data = most_resent_data( lineData, nminutes_to_show*60*1000 );


  var yMin = function(){ return d3.min(data, function(d){ return Math.min(d.y); }); };
  var yMax = function(){ return d3.max(data, function(d){ return Math.max(d.y); }); };
  var xMax = function(){ return d3.max(data, function(d){ return Math.max(d.x); }); };
  var xMin = function(){ return d3.min(data, function(d){ return Math.max(d.x); }); };



  var xRange = d3.scale.linear()
  .domain([xMin(),xMax()])
  .range([MARGINS.left, WIDTH - MARGINS.right]);
  var yRange = d3.scale.linear()
  .domain([0.8*yMin(),1.2*yMax()])
  .range([HEIGHT - MARGINS.top, MARGINS.bottom]);
  
  var xAxis = d3.svg.axis()
  .scale(xRange)
  .tickSize(5)
  .tickFormat( d3.time.format('%H:%M:%S') )
  .tickSubdivide(false);
  var yAxis = d3.svg.axis()
  .scale(yRange)
  .tickSize(5)
  .orient('left')
  .tickSubdivide(true);
  var lineFunc = d3.svg.line()
  .x(function(d){ return xRange(d.x); })
  .y(function(d){ return yRange(d.y); })
  .interpolate('linear')
  
  graph.append("svg:path").attr("d", lineFunc(data));
  
  vis.append('svg:g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + (HEIGHT - MARGINS.bottom) + ')')
  .call(xAxis);
  vis.append('svg:g')
  .attr('class', 'y axis')
  .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
  .call(yAxis);

  function update_d3_chart_fcn()
  {
    data = most_resent_data( lineData, nminutes_to_show*60*1000 );

    if( data.length < 3 )
      return;

    xRange = d3.scale.linear()
        .domain([xMin(),xMax()])
        .range([MARGINS.left, WIDTH - MARGINS.right]);
    yRange = d3.scale.linear()
        .domain([yMin()-0.2*(yMax()-yMin()),1.2*yMax()])
        .range([HEIGHT - MARGINS.top, MARGINS.bottom]);
    xAxis = d3.svg.axis()
        .scale(xRange)
        .tickSize(5)
        .tickFormat( timeToDisplayString )
        .tickSubdivide(false);
    yAxis = d3.svg.axis()
        .scale(yRange)
        .tickSize(5)
        .orient('left')
        .tickSubdivide(true);

    var doXform = false;
    //doXform if there is more than five minutes of data (or however long we
    //  choose the x-axis to be), meaning we will only show the most recent 5
    //  minutes.
    //  Need to also make it so xMin and xMax return the most recent 5 minutes
    //  of data

    if( doXform )
    {
      var initialXform = xRange(v.x) - xRange(data[data.length-2].x);

      graph.selectAll("path")
          .data([data]) // set the new data
          .attr("transform", "translate(" + initialXform + ")")
          .attr("d", lineFunc)
          .transition()
          .ease("linear")
          .duration(500)
          .attr("transform", "translate(" + xRange(data[0].x) + ")");
    }else
    {
      graph.selectAll("path")
          .data([data])
          .attr("d", lineFunc);
    }

    vis.selectAll("g.x.axis").call(xAxis);
    vis.selectAll("g.y.axis").call(yAxis);
  }//function update_d3_chart_fcn()

  update_d3_chart = update_d3_chart_fcn;
  update_d3_chart();
}