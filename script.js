mouseX = 0;
mouseY = 0;
mapSize = 2560;
zoom = 1;

d1 = false;
d2 = false;

rects = [];
circles={};
polygons = [];
lines = [];

waypointID = 0;
waypoints = {};

/*
waypoints = {
    1:{
        x: 1,
        y: 0,
        relation: [2,3]
    },
    2:{
        x: 0,
        y: 1,
        relation: [1,3]
    }
    3:{
        x: 1,
        y: 1,
        relation: [1,2]
    }
};
*/

// move circle
drag = false;
activeCircle = null;

// for creating relations
tempLine = null;
activeCircleFrom = null;
activeCircleTo = null;

// to create path
startCircle = null;
endCircle = null;
tempWaypoints = null;
tempLines = null;
matrix = [];


$(function(){

    loadWaypoints($('#track').val())

    canvasDiv=document.getElementById("canvas");
    window.gr = new jxGraphics(canvasDiv);

    $(document).on('mousemove','#canvas',function(e){
        getMouseXY(e);



        switch ($('#mode').val())
        {
            case 'relation':
                if (activeCircleFrom)
                {
                    if(!tempLine)
                    {
                        tempLine = new jxLine(activeCircleFrom.center,new jxPoint(mouseX,mouseY),getPen(4))
                    }

                    tempLine.toPoint = new jxPoint(mouseX,mouseY);
                    tempLine.draw(gr);
                }
                break;
            case 'move_waypoints':
                if (drag) {
                    if (activeCircle) {
                        activeCircle.center = new jxPoint(mouseX, mouseY);
                        activeCircle.draw(gr);

                        for(var i in lines)
                        {
                            if(lines[i].idTo == activeCircle.id)
                            {
                                lines[i].toPoint = activeCircle.center;
                                lines[i].draw(gr);
                            }

                            if(lines[i].idFrom == activeCircle.id)
                            {
                                lines[i].fromPoint = activeCircle.center;
                                lines[i].draw(gr);
                            }
                        }
                    }
                }
                break;
        }

    });

    $(document).on('mousedown','#canvas',function(){

    });

    $(document).on('mouseup','#canvas',function(){
        switch ($('#mode').val()) {
            case 'waypoints':
                drawPoint();
                break;
            case 'move_waypoints':
                drag = false;
                if (activeCircle)
                {
                    for (var i in waypoints[activeCircle.id].relation) {
                        waypoints[activeCircle.id].relation[i] = getDistance(activeCircle, circles[i])
                        waypoints[i].relation[activeCircle.id] = getDistance(activeCircle, circles[i])
                    }
                }
                activeCircle = null;
                break;
            case 'relation':
                if(activeCircleFrom && activeCircleTo)
                {
                    createRelation(activeCircleFrom, activeCircleTo);

                    activeCircleFrom = null;
                    activeCircleTo = null;
                }
                else
                {
                    activeCircleFrom = null;
                    activeCircleTo = null;
                    if(tempLine)
                        tempLine.remove();
                    tempLine = null;
                }
                break;
            case 'path':
                if(!startCircle)
                {
                    tempWaypoints = waypoints
                    startCircle = drawPoint(true);
                }
                else
                {
                    if(!endCircle)
                    {
                        endCircle = drawPoint(true);
                        createPath(startCircle, endCircle);
                    }
                    else
                    {
                        startCircle.remove()
                        endCircle.remove()
                        startCircle = null;
                        endCircle = null;
                        waypoints = tempWaypoints;

                        clearLines()

                        tempWaypoints = waypoints
                        startCircle = drawPoint(true);
                    }
                }
                break;
        }
    });


    //---------------------------------------------------
})
//Get mouse position
function getMouseXY(e)
{

    if (document.all) //For IE
    {
        mouseX = event.clientX + document.body.parentElement.scrollLeft;
        mouseY = event.clientY + document.body.parentElement.scrollTop;
    }
    else
    {
        mouseX = e.pageX
        mouseY = e.pageY
    }

    if (mouseX < 0){mouseX = 0}
    if (mouseY < 0){mouseY = 0}

    $('.mouse_helper').css({left: (mouseX+15)+'px', top:(mouseY+15)+'px'});// .text('X: '+(mouseX-1280) + ' Y: ' + (1280-mouseY));

    // mouseX = mouseX - canvasDiv.offsetLeft;
    // mouseY = mouseY - canvasDiv.offsetTop;

    return true;
}

function getColor()
{
    var color = null;

    if(document.getElementById("color").value!="")
    {
        color = new jxColor(document.getElementById("color").value);
    }
    else
    {
        color = new jxColor("blue");
    }
    return  color
}

function getPen(width)
{
    if(typeof width == 'undefined')
        width = 1;

    width = parseInt(width);

    if(width < 1)
        width = 1;

    return new jxPen(getColor(), width + 'px');
}

function getBrush()
{
    return new jxBrush( getColor() )
}

function checkPoints(noAlert)
{
    if(!noAlert)
    {
        if(points.length==0)
        {
            alert("Please click at any location on the blank canvas at left side to plot the points!");
            return false;
        }
        else if(points.length<3)
        {
            alert("3 or more points are required to draw a polygon! Please plot more points by clicking at any location on the blank canvas at left side.");
            return false;
        }
    }
    return true;
}

function drawPoint(show)
{
    waypoints[waypointID] = {};
    waypoints[waypointID].x = mouseX - 1280;
    waypoints[waypointID].y = 1280 - mouseY;
    waypoints[waypointID].relation = {};

    var cir = createCirlce(mouseX,mouseY,waypointID,show)

    ++waypointID;

    return cir;
}

function createCirlce(x,y, ID, show)
{
    var cir = new jxCircle(new jxPoint(x,y), 10, getPen(), getBrush());
    cir.id = ID;

    if(show)
        cir.draw(gr);

    cir.addEventListener('mousedown', circleMouseDown);
    cir.addEventListener('mouseup', circleMouseUp);
    cir.addEventListener('mouseover', circleMouseOver);
    cir.addEventListener('mouseout', circleMouseOut);
    circles[ID] = cir;
    return cir;
}

//Mousedown event handler for circle
function circleMouseDown(evt, obj) {

    switch ($('#mode').val()) {

        case 'move_waypoints':
            drag = true;
            activeCircle = obj;
            break;
        case 'relation':
            activeCircleFrom = obj;
            break;
    }
}

//Mouseup event handler for circle
function circleMouseUp(evt, obj) {

    switch ($('#mode').val()) {

        case 'move_waypoints':

            break;
        case 'relation':
            break;
    }
}

function circleMouseOver(evt, obj) {

    $('.mouse_helper').text(obj.id);

    if($('#mode').val() == 'waypoints')
        return;

    document.body.style.cursor = "pointer";

    obj.brush = new jxBrush(new jxColor("red"));
    obj.draw(gr);

    if(activeCircleFrom && activeCircleFrom.id != obj.id)
        activeCircleTo = obj;
}

function circleMouseOut(evt, obj) {

    $('.mouse_helper').text('');

    if($('#mode').val() == 'waypoints')
        return;

    document.body.style.cursor = "inherit";

    obj.brush = new jxBrush(getColor());
    obj.draw(gr);
}

LineMouseClick = function(evt,obj)
{
    if($('#mode').val() != 'remove_relation')
        return;

    for(var i in lines)
    {
        if(lines[i] == obj)
        {
            obj.remove()
            delete(waypoints[obj.idFrom].relation[obj.idTo])
            delete(waypoints[obj.idTo].relation[obj.idFrom])
            lines.splice(i,1)
            break;
        }
    }
};

LineMouseOver = function(evt,obj)
{
    document.body.style.cursor = "pointer";
};

LineMouseOut = function(evt,obj)
{
    document.body.style.cursor = "inherit";
};


function drawPolyline()
{
    if(!checkPoints())
        return;

    polyline = new jxPolyline(points,getPen(), getBrush());
    polyline.draw(gr);
}

function drawLine()
{
    line = new jxLine(points[points.length-2],points[points.length-1],getPen())
    line.draw(gr);

    lines.push(line);


}



function clearCanvas(clearTrack)
{
    //gr.clear();

    for(i in rects)
    {
        rects[i].remove()
    }

    for(i in circles)
    {
        circles[i].remove()
    }

    for(i in polygons)
    {
        polygons[i].remove()
    }

    clearLines();

    rects = [];
    circles={};
    polygons = [];

    if(clearTrack)
        waypoints = {};
}

function clearLines()
{
    for(i in lines)
    {
        lines[i].remove()
    }
    lines = [];
}

function clearPreviousPoints()
{
    for(i in rects)
    {
        rects[i].remove()
    }

    points=new Array();
    rects = new Array();
}

function track(track)
{
    canvasDiv.style.backgroundImage = "url(http://img.lfs.net/remote/maps/"+track+".jpg)";
    clearCanvas();
    loadWaypoints(track);
    return false;
}

function getDistance(activeCircleFrom, activeCircleTo)
{
    return Math.sqrt( Math.pow(activeCircleTo.center.x-activeCircleFrom.center.x,2) +  Math.pow(activeCircleTo.center.y-activeCircleFrom.center.y,2))
}

function createRelation(start, end)
{
    if(typeof waypoints[start.id].relation[end.id] == 'undefined')
        waypoints[start.id].relation[end.id] = getDistance(start, end);

    if(typeof waypoints[end.id].relation[start.id] == 'undefined')
        waypoints[end.id].relation[start.id] = getDistance(start, end);
    if(!tempLine)
        tempLine = new jxLine(start.center,end.center, getPen(4));

    tempLine.idFrom = start.id;
    tempLine.idTo = end.id;
    tempLine.fromPoint = start.center;
    tempLine.toPoint = end.center;
    tempLine.addEventListener('click', LineMouseClick);
    tempLine.addEventListener('mouseover', LineMouseOver);
    tempLine.addEventListener('mouseout', LineMouseOut);
    tempLine.draw(gr);
    lines.push(tempLine);
    tempLine = null;
}

function createPath(startCircle, endCircle)
{
    minStartDist = Infinity;
    minEndDist = Infinity;
    minStartCirlce = null;
    minEndCircle = null;



    for(var i in waypoints)
    {
        tmpStartDist = getDistance(circles[i], startCircle);
        tmpEndDist = getDistance(circles[i], endCircle);

        if(tmpStartDist <  minStartDist && i != startCircle.id)
        {
            minStartDist = tmpStartDist;
            minStartCirlce = i;
        }

        if(tmpEndDist <  minEndDist && i != endCircle.id)
        {
            minEndDist = tmpEndDist;
            minEndCircle = i;
        }
    }

    if(minStartCirlce != null  && minEndCircle != null)
    {
        createRelation(startCircle, circles[minStartCirlce]);
        createRelation(endCircle, circles[minEndCircle]);
    }

    for(var i in waypoints)
    {
        tempArray = [];
        for(var j in waypoints)
        {
            if(typeof waypoints[i].relation[j] != 'undefined')
                tempArray[j] = waypoints[i].relation[j];
            else if(i == j)
                tempArray[j] = 0;
            else
                tempArray[j] = Infinity;
        }

        matrix[i] = tempArray
    }

    //console.log(matrix)

    flag = [] // метка посещаемости точки
    var max = Infinity;
    var nmin = 0;

    d = [];
    p = [];
    n = 1;

    for(var i in matrix)
        flag[i] = true;

    var l = startCircle.id

    for(var i in matrix)
        d[i] = matrix[l][i]

    flag[l] = false

    for(var i in matrix)
    {
        max = Infinity;
        nmin = l;

        for(var j in matrix)
        {
            if (flag[j] && max > d[j])
            {
                max = d[j];
                nmin = j;
            }
        }

        l = nmin;
        flag[l] = false;

        for(var j in matrix)
        {
            if (flag[j] && d[j] > (matrix[l][j] + d[l]))
            {
                d[j] = matrix[l][j] + d[l];
                p[j] = parseInt(l);
            }
        }

    }

    var path = []

    prom = p[endCircle.id]
    do
    {
        path.unshift(prom);
        prom = p[prom];
    }
    while(prom != null);

    path.unshift(startCircle.id);
    path.push(endCircle.id);

    console.log(path)
    clearLines();

    for(var i = 0; i < path.length - 1; i++)
    {
        createRelation(circles[path[i]],circles[path[i+1]]);
    }
}

function loadWaypoints(track)
{
    waypoints = {}
    waypointID = 0;

    $.get('waypoints_' + track + '.json',function(data){

        waypoints = data.waypoints;
        waypointID = data.waypointID;

        for(var i in data.waypoints)
        {
            createCirlce( 1280 + data.waypoints[i].x, 1280 - data.waypoints[i].y, i, false)
        }

    },'json');
}