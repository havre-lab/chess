//This is to define basic things like canvas, context, and event handling
var canvas=document.getElementById("canvas");
var title=document.getElementById('title');
var ctx=canvas.getContext("2d");
var canvasSize=canvas.getBoundingClientRect();
var events=[];
//this is to define basic constants, as well as assets
const width=canvasSize.width;
const height=canvasSize.height;
const rowSquares=8;
const whitePieceImgs={
    'rook':document.getElementById('wr'),
    'bishop':document.getElementById('wb'),
    'queen':document.getElementById('wq'),
    'knight':document.getElementById('wn'),
    'pawn':document.getElementById('wp'),
    'king':document.getElementById('wk')
}
const blackPieceImgs={
    'rook':document.getElementById('br'),
    'bishop':document.getElementById('bb'),
    'queen':document.getElementById('bq'),
    'knight':document.getElementById('bn'),
    'pawn':document.getElementById('bp'),
    'king':document.getElementById('bk')
}
const sounds={
    'move':document.getElementById("move"),
    'capture':document.getElementById("capture"),
    'castle':document.getElementById("castle"),
    'promote':document.getElementById("promote")
}
const background=document.getElementById('board');
//this is to initialize variables that will be used later
var whitePieces;
var blackPieces;
var gameLoop;
var playerTurn;
var selectedPiece;
var hoverPositions;
var winner;

class Piece{
    constructor(type,x,y,player){
        this.pieceType=type;
        this.x=x;
        this.y=y;
        this.player=player;
        this.moved=false;
    }
    draw(){
        var teamAssets;
        if(this.player=='white'){
            teamAssets=whitePieceImgs;
        }
        else if(this.player=='black'){
            teamAssets=blackPieceImgs;
        }
        if(playerTurn=="white"){
            ctx.drawImage(teamAssets[this.pieceType],this.x*width/rowSquares,this.y*height/rowSquares,
        width/rowSquares,height/rowSquares);
        }
        else if(playerTurn=="black"){
            ctx.drawImage(teamAssets[this.pieceType],(rowSquares-1-this.x)*width/rowSquares,(rowSquares-1-this.y)*
            height/rowSquares,width/rowSquares,height/rowSquares);
        }
        
    }
}

function drawBackground(){
    ctx.drawImage(background,0,0,width,height)
}

function convertPiecesToGrid(){
    var grid=[]
    var rowTemplate=[]
    for(let i=0; i<rowSquares; i++){
        rowTemplate.push({})
    }
    for(let i=0; i<rowSquares; i++){
        grid.push(structuredClone(rowTemplate))
    }
    for(let i=0;i<whitePieces.length;i++){
        grid[whitePieces[i].y][whitePieces[i].x]={"player":'white',"index":i}
    }
    for(let i=0;i<blackPieces.length;i++){
        grid[blackPieces[i].y][blackPieces[i].x]={"player":'black',"index":i}
    }
    return grid;
}
function checkForCheck(player){
    var playerKingIndex;
    var playerList;
    var enemyPlayer;
    var enemyList;
    if(player=='white'){
        playerList=whitePieces;
        enemyPlayer='black';
        enemyList=blackPieces;
    }
    else if(player=='black'){
        playerList=blackPieces;
        enemyPlayer='white';
        enemyList=whitePieces;
    }
    for(let i=0; i<playerList.length; i++){
        if (playerList[i].pieceType=='king'){
            playerKingIndex=i;
        }
    }
    var inCheck=false;
    var enemyPieceMoves;
    for(let i=0;i<enemyList.length;i++){
        enemyPieceMoves=findPieceMoves(enemyPlayer,i);
        for(let j=0;j<enemyPieceMoves.length;j++){
            if(enemyPieceMoves[j].x==playerList[playerKingIndex].x &&
                enemyPieceMoves[j].y==playerList[playerKingIndex].y
            ){
                inCheck=true;
            }
        }
    }
    return inCheck;
}


function checkForKing(){
    whiteKing=false;
    for(let i=0; i<whitePieces.length;i++){
        if (whitePieces[i].pieceType=='king'){
            whiteKing=true;
        }
    }
    blackKing=false;
    for(let i=0; i<blackPieces.length;i++){
        if (blackPieces[i].pieceType=='king'){
            blackKing=true;
        }
    }
    if(whiteKing==false){
        winner='black'
    }
    if(blackKing==false){
        winner='white'
    }
}
function recursiveLineScan(x,y,dx,dy,team){
    var enemyTeam;
    if(team=="white"){
        enemyTeam='black'
    }
    else if(team=="black"){
        enemyTeam='white'
    }
    var unblocked=true;
    var locations=[];
    var newpos={"x":x,"y":y}
    while(unblocked){
        newpos.x+=dx;
        newpos.y+=dy;
        if(newpos.x>rowSquares-1 || newpos.x<0 || newpos.y>rowSquares-1 || newpos.y<0){
            unblocked=false;
        }
        else if(Object.keys(convertPiecesToGrid()[newpos.y][newpos.x])!=0){
            if(convertPiecesToGrid()[newpos.y][newpos.x].player==enemyTeam){
                locations.push({"x":newpos.x,"y":newpos.y})
            }
            unblocked=false;
        }
        
        else{
            locations.push({"x":newpos.x,"y":newpos.y})
        }
    }
    return locations;


}

function knightScan(x,y,dx,dy,team){
    var enemyTeam;
    if(team=="white"){
        enemyTeam='black'
    }
    else if(team=="black"){
        enemyTeam='white'
    }
    var location=[];
    newpos={"x":x+dx,"y":y+dy}
    if(newpos.x>rowSquares-1 || newpos.x<0 || newpos.y>rowSquares-1 || newpos.y<0){
        location=[];
    }
    else if(Object.keys(convertPiecesToGrid()[newpos.y][newpos.x])!=0 && convertPiecesToGrid()[newpos.y]
[newpos.x].player!=enemyTeam){

        location=[];
    }
    else{
        location=[newpos]
    }

    return location;

}
function pawnScan(x,y,team){
    var pawnDirection;
    var startLocation;
    var pawnDestination;
    var locations=[];
    var enemyTeam;
    if(team=='white'){
        pawnDirection=-1;
        startLocation=6;
        pawnDestination=0;
        enemyTeam='black';
    }
    else if(team=='black'){
        pawnDirection=1;
        startLocation=1;
        pawnDestination=7;
        enemyTeam='white';
    }
    if(y!=pawnDestination){
        if(Object.keys(convertPiecesToGrid()[y+pawnDirection][x])==0){
            locations.push({"x":x,"y":y+pawnDirection})
            if(y==startLocation && Object.keys(convertPiecesToGrid()[y+pawnDirection*2][x])==0){
                locations.push({"x":x,"y":y+pawnDirection*2})
                
            }
        }
        if(x>0){
            if(Object.keys(convertPiecesToGrid()[y+pawnDirection][x-1])!=0
            && convertPiecesToGrid()[y+pawnDirection][x-1].player==enemyTeam){
                locations.push({"x":x-1,"y":y+pawnDirection})
            }
            
        }
        if(x<rowSquares-1){
            if(Object.keys(convertPiecesToGrid()[y+pawnDirection][x+1])!=0
            && convertPiecesToGrid()[y+pawnDirection][x+1].player==enemyTeam){
            locations.push({"x":x+1,"y":y+pawnDirection})
            }
        }
    }
    return locations;

}


function findPieceMoves(player,index){
    var possibleMoves=[];
    var pieceTargetting;
    var teamList;
    if (player=='black'){
        pieceTargetting=blackPieces[index]
        teamList=blackPieces;
    }
    else if(player=='white'){
        pieceTargetting=whitePieces[index]
        teamList=whitePieces;
    }

    if (pieceTargetting.pieceType=="rook" || pieceTargetting.pieceType=="queen"){
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,1,0,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,0,1,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,-1,0,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,0,-1,player))
    }
    if(pieceTargetting.pieceType=="bishop" || pieceTargetting.pieceType=="queen"){
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,1,1,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,1,-1,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,-1,1,player))
        possibleMoves=possibleMoves.concat(recursiveLineScan(pieceTargetting.x,pieceTargetting.y,-1,-1,player))
    }
    if(pieceTargetting.pieceType=="knight"){
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,2,1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,1,2,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-2,1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-1,2,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,2,-1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,1,-2,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-2,-1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-1,-2,player))
    }
    if(pieceTargetting.pieceType=="king"){
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,1,1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,1,0,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,1,-1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,0,-1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-1,-1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-1,0,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,-1,1,player))
        possibleMoves=possibleMoves.concat(knightScan(pieceTargetting.x,pieceTargetting.y,0,1,player))
        
        if(pieceTargetting.moved==false && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x+1]).length==0 && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x+2]).length==0 && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x+3]).length!=0 && convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x+3].player==player 
        && teamList[convertPiecesToGrid()[pieceTargetting.y][pieceTargetting
        .x+3].index].pieceType=='rook')
        {
            possibleMoves.push({"x":pieceTargetting.x+2,"y":pieceTargetting.y})
        }
        
        if(pieceTargetting.moved==false && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x-1]).length==0 && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x-2]).length==0 && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x-3]).length==0 && Object.keys(convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x-4]).length!=0 && convertPiecesToGrid()[pieceTargetting.y]
        [pieceTargetting.x-4].player==player 
        && teamList[convertPiecesToGrid()[pieceTargetting.y][pieceTargetting
        .x-4].index].pieceType=='rook')
        {
            possibleMoves.push({"x":pieceTargetting.x-2,"y":pieceTargetting.y})
        }

    }
    if(pieceTargetting.pieceType=="pawn"){
        possibleMoves=possibleMoves.concat(pawnScan(pieceTargetting.x,pieceTargetting.y,player))
    }

    return possibleMoves;
}


function filterCheckableLocations(positions,team,index){
    var pieceTargetting;
    var delIndexes=[];
    var saveList;
    var sampleList;
    var prevX=0;
    var prevY=0;
    var storageEnemy;
    var capturingMoved;
    var enemyList;
    if (team=='black'){
        pieceTargetting=blackPieces[index]
        sampleList=blackPieces;
        enemyList=whitePieces;
    }
    else if(team=='white'){
        pieceTargetting=whitePieces[index]
        sampleList=whitePieces;
        enemyList=blackPieces;
    }
    for(let i=0; i<positions.length; i++){
        capturingMoved=false;
        saveList=structuredClone(sampleList);
        prevX=sampleList[index].x;
        prevY=sampleList[index].y;
        if(Object.keys(convertPiecesToGrid()[positions[i].y][positions[i].x])!=0){
            capturingMoved=true;
            storageEnemy=enemyList.splice(convertPiecesToGrid()[positions[i].y][positions[i].x].index,1)
            [0]
        }
        sampleList[index].x=positions[i].x;
        sampleList[index].y=positions[i].y;
        if(checkForCheck(team)){
            delIndexes.push(i);
        }
        sampleList[index].x=prevX;
        sampleList[index].y=prevY;
        if(capturingMoved && storageEnemy!==null && storageEnemy!==undefined && Object.keys(storageEnemy)!=0){
            enemyList.push(storageEnemy)
        }
        
        
    }
    delIndexes.reverse();
    for(let i=0; i<delIndexes.length; i++){
        positions.splice(delIndexes[i],1)
    }
    return positions;
}

function checkForMate(team){
    var teamList;
    var possibleMoves=[];
    var enemyTeam;
    if(team=='white'){
        teamList=whitePieces;
        enemyTeam='black'
    }
    else if(team=='black'){
        teamList=blackPieces;
        enemyTeam='white'
    }
    for(let i=0; i<teamList.length; i++){
        possibleMoves=possibleMoves.concat(
            filterCheckableLocations(findPieceMoves(team,i),team,i)
        )
    }
    if(possibleMoves.length==0){
        if(checkForCheck(team)){
            winner=enemyTeam
        }
        else{
            winner='draw'
        }
        
    }
}

function handleEventMousedown(event){
    if(event.clientX>canvasSize.left && event.clientX<canvasSize.right 
        && event.clientY>canvasSize.top && event.clientY<canvasSize.bottom
    ){
        var x=event.clientX-canvasSize.left;
        var y=event.clientY-canvasSize.top;
        var gridX=Math.floor(x/width*rowSquares);
        var gridY=Math.floor(y/width*rowSquares);
        var pieceObject;
        if(playerTurn=="white"){
            pieceObject=convertPiecesToGrid()[gridY][gridX];
        }
        else if(playerTurn=="black"){
            pieceObject=convertPiecesToGrid()[rowSquares-gridY-1][rowSquares-gridX-1];
        }
        if(pieceObject.player==playerTurn){
            selectedPiece=pieceObject;
        }
        if(Object.keys(selectedPiece)!=0){
            hoverPositions=filterCheckableLocations(findPieceMoves(selectedPiece.player,selectedPiece.index),
        selectedPiece.player,selectedPiece.index)
        }

    }
}
function handleEventMouseup(event){
    if(event.clientX>canvasSize.left && event.clientX<canvasSize.right 
        && event.clientY>canvasSize.top && event.clientY<canvasSize.bottom
    ){
        var x=event.clientX-canvasSize.left;
        var y=event.clientY-canvasSize.top;
        var gridX=Math.floor(x/width*rowSquares);
        var gridY=Math.floor(y/width*rowSquares);
        var trueGridX=structuredClone(gridX);
        var trueGridY=structuredClone(gridY);
        if(playerTurn=="black"){
            trueGridX=rowSquares-1-trueGridX;
            trueGridY=rowSquares-1-trueGridY;
        }
        var placementLegal=false;
        var hoverX;
        var hoverY;
        var enemyTeam;
        var enemyList;
        var teamList;

        

        var playSound=sounds.move;

        for (let i=0; i<hoverPositions.length; i++){
            if(hoverPositions[i].x==trueGridX && hoverPositions[i].y==trueGridY){
                hoverX=hoverPositions[i].x;
                hoverY=hoverPositions[i].y
                placementLegal=true;
            }
        }
        
        if (placementLegal){
            if(playerTurn=='white'){
                enemyTeam='black'
                enemyList=blackPieces
                teamList=whitePieces
            }
            else if(playerTurn=='black'){
                enemyTeam='white'
                enemyList=whitePieces
                teamList=blackPieces
            }
            var gridCaptureTest=convertPiecesToGrid();
            var capturing=false;
            if(Object.keys(gridCaptureTest[hoverY][hoverX]).length>0){
                capturing=true;
            }
            else{
                capturing=false;
            }
            if (capturing){
                playSound=sounds.capture;
            }
            
            
                playerTurn=enemyTeam;
                if(capturing){
                    enemyList.splice(gridCaptureTest[hoverY][hoverX].index,1)
                }
                if(teamList[selectedPiece.index].pieceType=='pawn' &&
                    (hoverY==0||hoverY==7)
                ){
                    teamList[selectedPiece.index].pieceType='queen'
                    playSound=sounds.promote
                }

                if(teamList[selectedPiece.index].pieceType=='king' &&
                    hoverX-teamList[selectedPiece.index].x==2
                ){
                    teamList[convertPiecesToGrid()[hoverY][hoverX+1].index].x=hoverX-1;
                    playSound=sounds.castle
                }
                if(teamList[selectedPiece.index].pieceType=='king' &&
                    hoverX-teamList[selectedPiece.index].x==-2
                ){
                    teamList[convertPiecesToGrid()[hoverY][hoverX-2].index].x=hoverX+1;
                    playSound=sounds.castle
                }
                teamList[selectedPiece.index].x=hoverX;
                teamList[selectedPiece.index].y=hoverY;
                teamList[selectedPiece.index].moved=true;
                
            
            

            playSound.play()
            selectedPiece={}
            hoverPositions=[]
            
            checkForMate('white');
            checkForMate('black');
        }
        

    }
    
}

function startGame(){
    playerTurn='white';
    selectedPiece={};
    hoverPositions=[];
    winner='none';
    whitePieces=[];
    blackPieces=[];
    //push the rooks
    whitePieces.push(new Piece('rook',0,7,'white'));
    whitePieces.push(new Piece('rook',7,7,'white'));
    blackPieces.push(new Piece('rook',0,0,'black'));
    blackPieces.push(new Piece('rook',7,0,'black'));
    //push the bishops
    whitePieces.push(new Piece('bishop',2,7,'white'));
    whitePieces.push(new Piece('bishop',5,7,'white'));
    blackPieces.push(new Piece('bishop',2,0,'black'));
    blackPieces.push(new Piece('bishop',5,0,'black'));
    //push the knights
    whitePieces.push(new Piece('knight',1,7,'white'));
    whitePieces.push(new Piece('knight',6,7,'white'));
    blackPieces.push(new Piece('knight',1,0,'black'));
    blackPieces.push(new Piece('knight',6,0,'black'));
    //push the queens
    whitePieces.push(new Piece('queen',3,7,'white'));
    blackPieces.push(new Piece('queen',3,0,'black'));
    //push the kings
    whitePieces.push(new Piece('king',4,7,'white'));
    blackPieces.push(new Piece('king',4,0,'black'));
    //push the pawns
    for(let i=0; i<rowSquares; i++){
        whitePieces.push(new Piece('pawn',i,6,'white'));
        blackPieces.push(new Piece('pawn',i,1,'black'))
    }

    gameLoop=setInterval(gameTick,1000/60);
}


function gameTick(){
    //update Canvas Size
    canvasSize=canvas.getBoundingClientRect();
    //logic
        //events
    for(let i=0; i<events.length; i++){
        if(events[i].eventType=='mousedown'){
            handleEventMousedown(events[i].eventDetails)
        }
        if(events[i].eventType=='mouseup'){
            handleEventMouseup(events[i].eventDetails)
        }
    }
    events=[];
    

    //drawing
    ctx.clearRect(0,0,width,height);
    drawBackground();

    for(let i=0; i<whitePieces.length; i++){
        whitePieces[i].draw();
    }
    for(let i=0; i<blackPieces.length; i++){
        blackPieces[i].draw();
    }
    for (let i=0; i<hoverPositions.length; i++){
        ctx.fillStyle="rgb(100 100 100 / 80%)"
        if(playerTurn=='white'){
            ctx.fillRect(hoverPositions[i].x*width/rowSquares,hoverPositions[i].y*height/rowSquares
            ,width/rowSquares,height/rowSquares)
        }
        else if(playerTurn=="black"){
            ctx.fillRect((rowSquares-1-hoverPositions[i].x)*width/rowSquares,
            (rowSquares-1-hoverPositions[i].y)*height/rowSquares,width/rowSquares,height/rowSquares)
        }
    }
    if(winner!="none"){
        ctx.fillStyle="rgb(100 100 100 / 70%)"
        ctx.fillRect(0,0,width,height)
        ctx.fillStyle="rgb(255 255 255)"
        ctx.font=`${width/5}px Helvetica`
        if(winner=='white'){
            ctx.fillText("White Wins!",0,height/2,width)
            title.innerHTML="White Wins! - Chess"
        }
        else if(winner=='black'){
            ctx.fillText("Black Wins!",0,height/2,width)
            title.innerHTML="Black Wins! - Chess"
        }
        else if(winner=='draw'){
            ctx.fillText("Draw",0,height/2,width)
            title.innerHTML="Draw - Chess"
        }
        ctx.font=`${width/9}px Garmond`
        ctx.fillText("New game in 3 seconds",0,height,width)
        clearInterval(gameLoop)
        setTimeout(startGame,3000)
    }
    else{
        if(playerTurn=='white'){
            title.innerHTML="White Turn - Chess"
        }
        else if(playerTurn=='black'){
            title.innerHTML="Black Turn - Chess"
        }
    }

    


}

startGame();


document.addEventListener('mousedown',function(event){
    events.push({eventType:'mousedown',eventDetails:event})
})
document.addEventListener('mouseup',function(event){
    events.push({eventType:'mouseup',eventDetails:event})
})