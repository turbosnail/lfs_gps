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


waypoints = [];

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
var tempWaypoints = null;
tempLines = null;



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
                drawPoint(true);
                break;
            case 'move_waypoints':
                drag = false;
                if (activeCircle)
                {
                    for (var i in waypoints[activeCircle.id].relation) {
                        waypoints[activeCircle.id].relation[i] = getWaypointDistance(activeCircle.id, i)
                        waypoints[i].relation[activeCircle.id] = getWaypointDistance(activeCircle.id, i)
                    }
                }
                activeCircle = null;
                break;
            case 'relation':
                if(activeCircleFrom && activeCircleTo)
                {
                    createRelation(activeCircleFrom.id, activeCircleTo.id);

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
                    tempWaypoints = clone(waypoints);


                    startCircle = drawPoint(true);
                }
                else
                {
                    if(!endCircle)
                    {
                        endCircle = drawPoint(true);
                        createPath(startCircle.id, endCircle.id);

                        waypoints = clone(tempWaypoints)
                    }
                    else
                    {
                        startCircle.remove();
                        endCircle.remove();
                        startCircle = null;
                        endCircle = null;


                        clearLines()
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

    waypoint = {};
    waypoint.x = mouseX - 1280;
    waypoint.y = 1280 - mouseY;
    waypoint.relation = {};

    var cir = createCirlce(mouseX,mouseY,waypoints.length,show)

    waypoints.push(waypoint);

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
        waypoints = [];
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
    //loadWaypoints(track);
    return false;
}

function getWaypointDistance(start, end)
{
    return getDistance(waypoints[start], waypoints[end]);
}

function createRelation(start, end)
{
    startPoint = new jxPoint(1280 + waypoints[start].x, 1280 - waypoints[start].y);
    endPoint = new jxPoint(1280 + waypoints[end].x, 1280 - waypoints[end].y);

    if(typeof waypoints[start].relation[end] == 'undefined')
        waypoints[start].relation[end] = getWaypointDistance(start, end);

    if(typeof waypoints[end].relation[start] == 'undefined')
        waypoints[end].relation[start] = getWaypointDistance(start, end);
    if(!tempLine)
        tempLine = new jxLine(startPoint,endPoint, getPen(4));

    tempLine.idFrom = start;
    tempLine.idTo = end;
    tempLine.fromPoint = startPoint;
    tempLine.toPoint = endPoint;
    tempLine.addEventListener('click', LineMouseClick);
    tempLine.addEventListener('mouseover', LineMouseOver);
    tempLine.addEventListener('mouseout', LineMouseOut);
    tempLine.draw(gr);
    lines.push(tempLine);
    tempLine = null;
}

function createPath(startID, endID)
{
    var minStartDist = Infinity;
    var minEndDist = Infinity;
    var minStartCirlce = null;
    var minEndCircle = null;
    var matrix = [];



    for(var i in waypoints)
    {
        tmpStartDist = getWaypointDistance(i, startID);
        tmpEndDist = getWaypointDistance(i, endID);

        if(tmpStartDist <  minStartDist && i != startID)
        {
            minStartDist = tmpStartDist;
            minStartCirlce = i;
        }

        if(tmpEndDist <  minEndDist && i != endID)
        {
            minEndDist = tmpEndDist;
            minEndCircle = i;
        }

        /*for(var j in waypoints[i].relation)
        {
            if(i != startID)
            {
                var p = getProjection(waypoints[i], waypoints[j], waypoints[startID]);

                if(isBelong(waypoints[i], waypoints[j], p))
                {
                    console.log(waypoints[startID])
                    console.log(waypoints[i])
                    console.log(waypoints[j])
                    console.log(p);

                    p.x = 1280 + p.x;
                    p.y = 1280 - p.y;

                    var p1 = new jxPoint(1280+waypoints[startID].x, 1280-waypoints[startID].y)
                    var ps = new jxPoint(1280+waypoints[i].x, 1280-waypoints[i].y)
                    var pe = new jxPoint(1280+waypoints[j].x, 1280-waypoints[j].y)

                    var l =  new jxLine(p1, p, new jxPen(new jxColor('red'),'2px'));
                    l.draw(gr)

                    var l =  new jxLine(ps, pe, new jxPen(new jxColor('red'),'2px'));
                    l.draw(gr)

                    var cir = new jxCircle(p, 10, getPen(), getBrush());
                    cir.draw(gr);

                    return;
                }
            }

           *//* if(i != endID)
            {
                var p = getProjection(waypoints[i], waypoints[j], waypoints[endID]);
                p.x = 1280 - p.x;
                p.y = 1280 + p.y;

                var cir = new jxCircle(p, 10, getPen(), getBrush());
                cir.draw(gr);
            }*//*
        }*/
    }

    if(minStartCirlce != null  && minEndCircle != null)
    {

        createRelation(startID, minStartCirlce);
        createRelation(endID, minEndCircle);
    }

    for(var i in waypoints)
    {
        var tempArray = [];
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

    var flag = [] // метка посещаемости точки
    var max = Infinity;
    var nmin = 0;

    var d = [];
    var p = [];
    var n = 1;

    for(var i in matrix)
        flag[i] = true;

    var l = startID

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

    var prom = p[endID]
    do
    {
        path.unshift(prom);
        prom = p[prom];
    }
    while(prom != null);

    path.unshift(startID);
    path.push(endID);

    console.log(path)
    clearLines();

    for(var i = 0; i < path.length - 1; i++)
    {
        createRelation(path[i],path[i+1]);
    }
}

function loadWaypoints(track)
{
    waypoints = [];
    waypointID = 0;

    $.get(track + '.json',function(data){

        waypoints = data;

        for(var i = 0; i < waypoints.length -1; i++)
        {
            //createCirlce( 1280 + data.waypoints[i].x, 1280 - data.waypoints[i].y, i, true)
            for(j in waypoints[i].relation)
                createRelation(i, j)
        }

    },'json');
}

function save()
{
    $.post('save.php',
        {
            waypoints: JSON.stringify(waypoints,null,4),
            track: $('#track').val()
        },
        function(){

    },'json');
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


/**
 *
 * @param A - jxPoint of line
 * @param B - jxPoint of line
 * @param C - jxPoint
 * @returns {jxPoint}
 */
function getProjection(A,B,C)
{
    var k = (B.y - A.y)/(B.x - A.x);
    var x = Math.ceil((k* A.x + C.x/k - A.y + C.y)/(k + 1/k));
    var y = Math.ceil(k * (x - A.x) + A.y)
    return new jxPoint(x, y);
}

/**
 *
 * @param A - jxPoint of line
 * @param B - jxPoint of line
 * @param C - jxPoint
 * @returns {boolean}
 */
function isBelong(A,B,C)
{
    var lineAB = getDistance(A,B);
    var lineAC = getDistance(A,C);
    var lineBC = getDistance(B,C);
    console.log(lineAB == lineAC + lineBC);
    return lineAB == lineAC + lineBC;
}

/**
 *
 * @param A - jxPoint
 * @param B - jxPoint
 * @returns {number}
 */
function getDistance(A, B)
{
    return Math.sqrt( Math.pow(A.x-B.x,2) +  Math.pow(A.y-B.y,2));
}