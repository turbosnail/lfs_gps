mouseX = 0;
mouseY = 0;
mapSize = 2560;
zoom = 1;

d1 = false;
d2 = false;

rects = [];
circles=[];
polygons = [];
lines = [];

waypointID = 1;
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

drag = false;

tempLine = null;
activeCircle = null;

started = false;
activeCircleFrom = null;
activeCircleTo = null;


$(function(){
    canvasDiv=document.getElementById("canvas");
    window.gr = new jxGraphics(canvasDiv);

    $(document).on('mousemove','#canvas',function(e){
        getMouseXY(e);

        if (drag) {
            if (activeCircle) {
                activeCircle.center = new jxPoint(mouseX, mouseY);
                activeCircle.draw(gr);
            }
        }

        if($('#mode').val() == 'relation')
        {
            if (activeCircleFrom)
            {
                if(!tempLine)
                {
                    tempLine = new jxLine(activeCircleFrom.center,new jxPoint(mouseX,mouseY),getPen(4))
                }

                tempLine.toPoint = new jxPoint(mouseX,mouseY);
                tempLine.draw(gr);
            }
        }

    });

    $(document).on('mousedown','#canvas',function(){

    });

    $(document).on('mouseup','#canvas',function(){
        switch ($('#mode').val())
        {
            case 'waypoints':
                drawPoint();
                break;
            case 'relation':
                if(activeCircleFrom && activeCircleTo)
                {
                    if(!in_array(activeCircleTo.id,waypoints[activeCircleFrom.id].relation))
                        waypoints[activeCircleFrom.id].relation.push(activeCircleTo.id);

                    if(!in_array(activeCircleFrom.id,waypoints[activeCircleTo.id].relation))
                        waypoints[activeCircleTo.id].relation.push(activeCircleFrom.id);

                    tempLine.toPoint = activeCircleTo.center;
                    tempLine.draw(gr);
                    lines.push(tempLine)
                    tempLine = null;

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

    $('.mouse_helper').css({left: (mouseX+15)+'px', top:(mouseY+15)+'px'}).text('X: '+(mouseX-1280) + ' Y: ' + (1280-mouseY));

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

function drawPoint()
{
    var cir = new jxCircle(new jxPoint(mouseX,mouseY), 10, getPen(), getBrush());
    cir.id = waypointID;
    cir.draw(gr);
    cir.addEventListener('mousedown', circleMouseDown);
    cir.addEventListener('mouseup', circleMouseUp);
    cir.addEventListener('mouseover', circleMouseOver);
    cir.addEventListener('mouseout', circleMouseOut);

    waypoints[waypointID] = {};
    waypoints[waypointID].x = mouseX - 1280;
    waypoints[waypointID].y = 1280 - mouseY;
    waypoints[waypointID].relation = [];

    circles.push(cir);

    ++waypointID;

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
            drag = false;
            activeCircle = null;
            break;
        case 'relation':
            break;
    }
}

function circleMouseOver(evt, obj) {

    if($('#mode').val() == 'waypoints')
        return;

    document.body.style.cursor = "pointer";

    obj.brush = new jxBrush(new jxColor("red"));
    obj.draw(gr);

    if(activeCircleFrom && activeCircleFrom.id != obj.id)
        activeCircleTo = obj;
}

function circleMouseOut(evt, obj) {

    if($('#mode').val() == 'waypoints')
        return;
    document.body.style.cursor = "inherit";

    obj.brush = new jxBrush(getColor());
    obj.draw(gr);
}



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



function clearCanvas()
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

    for(i in lines)
    {
        lines[i].remove()
    }


    rects = [];
    circles=[];
    polygons = [];
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
    return false;
}

function in_array(needle, haystack)
{
    for(var i in haystack)
    {
        if(haystack[i] == needle)
            return true;
    }
    return false;
}