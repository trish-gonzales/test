$(function(){
    console.log('Script is running');
    $('#loginform').hide();

    $('#loginbtn').click(function(){
        $('#loginform').show();
    })
    
    $('#Login').click(function(){
        window.open('/Main/Home.html','_self')
    })


})