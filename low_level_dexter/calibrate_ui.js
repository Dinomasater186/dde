window.cal_svg_height = 410
window.cal_working_axis = undefined //this is either undefined, 0, 1, 2, 3, 4 (ie zero based joint numbers)

function make_calibrate_joint_buttons_html(){
     var result = ""
     for(var i = 1; i <= 5; i++){
        var checkmark = "&nbsp;&nbsp;&nbsp;"
        if(i < 3) { checkmark = "&#10004;" }
        //if (i === 3) { checkmark = "<span style='color:#00DD00;'>&#8680;</span>" }
        else if (i > 3) { checkmark = "&nbsp;&nbsp;&nbsp;" }
        result += "<input name='cal_joint' type='radio'  style=margin-top:10px; data-onchange='true' title='Start calibrating this joint.' value='Joint" + i + "'/>" +
                  "Joint " + i +
                  //" <span id='j" + i + "checkmark' style='margin-left:0px'>" + checkmark + " </span><br/>" +
                  "<input id='cal_joint_done" + i + "_id' type='checkbox' style='margin-left:20px;'data-onchange='true' value='Done' title='Mark that you have completed calibration for this Joint.'/> Done<br/>"
     }
    const stop_button    = "<br/><input type='button' value='Stop'    style='margin-left:20px;' title='Stop the currently running Joint calibration.'/><p/>"
    const restart_button =      "<input type='button' value='Restart' style='margin-left:20px;' title='Restart the calibration for the selected Joint.'/><p/>"
    const save_button    =      "<input type='button' value='Save'    title='Save the calibration settings for all Joints to disk.'/>"
    return result + stop_button + restart_button + save_button
}

function flip_point_y(y){
    return (y * -1) + window.cal_svg_height
}

function remove_svg_points(){
    $(".cal_svg_circle").remove();
}

function are_all_joints_calibrated(){
    return (cal_joint_done1_id.checked &&
            cal_joint_done2_id.checked &&
            cal_joint_done3_id.checked &&
            cal_joint_done4_id.checked &&
            cal_joint_done5_id.checked)
}

function handle_cal(vals){
    var the_robot = cal_get_robot()
    if (vals.clicked_button_value.startsWith("cal_joint_done")) {
        if(Job.CalSensors.is_active()){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        //let user check or uncheck this Joint, its just "note taking" for the user.
        //window.cal_working_axis = undefined //don't do because we have the radio button selected, and besides, we might want to "restart" the current one.
        remove_svg_points()
        cal_instructions_id.innerHTML = (are_all_joints_calibrated() ?
                                        "All joints are calibrated.<br/>&nbsp;&nbsp;&nbsp;&nbsp;Click the 'Save' button." :
                                        "Choose <b>Restart</b> or a joint to calibrate.<br/>"
                                        )
    }
    else if (vals.clicked_button_value.startsWith("cal_joint")){
        if(window.cal_working_axis !== undefined){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        remove_svg_points()
        var working_axis_1_5 = parseInt(last(vals[vals.clicked_button_value]))
        window.cal_working_axis = working_axis_1_5 - 1 //the only place this global is set besides being inited (to undefined)
        var message = "Adjust the 2 trim pots for Joint " + working_axis_1_5 + " to make a circle.<br/>"
        if ([1, 4, 5].includes(working_axis_1_5)){
            message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + (window.cal_working_axis - 1) + "'s two position screws."
        }
        cal_instructions_id.innerHTML = message
        if (the_robot.simulate === true) {
            warning("To calibrate a Dexter, it must have its simulate property set to false.<br/>" +
                the_robot.name + " has simulate==true. <br/>" +
                'Use <code>new Dexter({name: "' + the_robot.name + '" simulate: true ...})</code><br>' +
                "to define your Dexter.")
        }
        else if (Robot.get_simulate_actual(the_robot.simulate) == true){
            cal_instructions_id.innerHTML = "<span style='color:red'>To calibrate " + the_robot.name + ", the Jobs menu/Simulate? radio button <br/>" +
                                            "&nbsp;&nbsp;&nbsp;&nbsp;should be set to false.</span>"
        }
        else {
            Job.CalSensors.start({robot: the_robot})
        }
    }
	else if(vals.clicked_button_value === "svg_id") {
	 if (window.cal_working_axis === undefined){
         cal_instructions_id.innerHTML = "<span style='color:red'>You must first press a Joint button to calibrate.<br/></span>"
     }
     else {
         cal_instructions_id.innerHTML = "Check this joint's <b>Done</b> check box<br/>&nbsp;&nbsp;&nbsp;&nbsp;if you like the center you've chosen."
         const y_val_to_save = flip_point_y(vals.offsetX)
         centers_string[window.cal_working_axis][0] =
              "0x" + ((vals.offsetX  * 10) * 65536).toString(16)
         centers_string[window.cal_working_axis][1] =
              "0x" + ((y_val_to_save * 10) * 65536).toString(16)
         out ("0x" + ((vals.offsetX  * 10) * 65536).toString(16) + " " +
              "0x" + ((y_val_to_save * 10) * 65536).toString(16))
         $("." + "cal_svg_circle").css("fill", "#fdd715")
         append_in_ui("svg_id", svg_circle({html_class: "cal_svg_circle",
                                           cx: vals.offsetX,
                                           cy: vals.offsetY,
                                           r: 3,
                                           color: "red"}))
     }
    }
    else if (vals.clicked_button_value == "Stop"){
        if(Job.CalSensors.is_active()){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        cal_instructions_id.innerHTML = "Click the <b>Restart</b> button or <br/>" +
                                        "&nbsp;&nbsp;&nbsp;&nbsp;click the radio button for another Joint."
    }
    else if (vals.clicked_button_value == "Restart"){
        if(Job.CalSensors.is_active()){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        remove_svg_points()
        if(window.cal_working_axis !== undefined){
            var message = "Adjust the 2 trim pots for Joint " + (window.cal_working_axis - 1) + " to make a circle.<br/>"
            if ([1, 4, 5].includes(window.cal_working_axis - 1)){
                message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + (window.cal_working_axis - 1) + "'s two position screws."
            }
            cal_instructions_id.innerHTML = message
            Job.CalSensors.start({robot: cal_get_robot()})
        }
        else {
            cal_instructions_id.innerHTML = "No selected joint to Restart.<br/>&nbsp;&nbsp;&nbsp;&nbsp;Click a Joint's radio button."
        }
    }
    else if (vals.clicked_button_value === "Save"){
        const file_write_worked = centers_output()
        var message_prefix
        if(file_write_worked) {
            message_prefix = "Settings saved<br/>&nbsp;&nbsp;&nbsp;&nbsp;Now click"
        }
        else {
            message_prefix = "<span style='color:red;'>Can't write file.</span> See Output and Doc panes,<br/>&nbsp;&nbsp;&nbsp;&nbsp;then click"
            open_doc(dexters_file_system_doc_id)
        }
        cal_instructions_id.innerHTML = message_prefix + " <b>Calibrate Optical Encoders</b>"
    }
    else if (vals.clicked_button_value === "calibrate_optical_id"){
        if (the_robot.simulate === true) {
            warning("To calibrate a Dexter, it must have its simulate property set to false.<br/>" +
                the_robot.name + " has simulate==true. <br/>" +
                'Use <code>new Dexter({name: "' + the_robot.name + '" simulate: true ...})</code><br>' +
                "to define your Dexter.")
        }
        else if (Robot.get_simulate_actual(the_robot.simulate) == true){
            cal_instructions_id.innerHTML = "<span style='color:red'>To calibrate " + the_robot.name + ", the Jobs menu/Simulate? radio button <br/>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;should be set to false.</span>"
        }
        else if (confirm("Caution! Clear the hemisphere that the fully extended Dexter can reach.")){
            Job.CalEncoders.start({robot: cal_get_robot()})
            cal_instructions_id.innerHTML = "Now calibrating optical encoders...<br/>&nbsp;&nbsp;&nbsp;&nbsp;<i>This takes about a minute.</i>"
        }
        else {
            cal_instructions_id.innerHTML = "Optical encoder calibration canceled.<br/>"
        }
    }
    else { shouldnt("handle_cal called with invalid vals.clicked_button_value of: " + vals.clicked_button_value) }
}

function make_dexter_robot_menu_html(){
    var result = "<select id='robot_to_calibrate_id' style='font-size:16px;'>\n"
    for(let dex_name of Dexter.all_names){
        result += "<option>" + dex_name + "</option>\n"
    }
    return result + "</select>"
}

//used in this file and ViewEye
function cal_get_robot(){
    return Robot[robot_to_calibrate_id.value]
}

function init_calibrate(){
    init_view_eye() //will define (or redefine the view eye job, which is ok)
    init_calibrate_optical() //will define (or redefine the calibrate_optical job, which is ok)
  show_window({
    title:"Calibrate your Dexter(s)",
    x:325, y: 0, width:590, height: 615,
    content:
  "1. Choose a Dexter to calibrate: " + make_dexter_robot_menu_html() + "<br/>" +
  "2. <span id='cal_instructions_id'>Calibrate optical sensors by<br/>&nbsp;&nbsp;&nbsp;&nbsp;choosing each joint to calibrate.</span><br/>" +
     "<table style='margin:0px;padding:0px;'><tr><td style='margin:0px;padding-right:10px;background-color:#ffc69e;'>" +
      make_calibrate_joint_buttons_html() +
      "</td><td><table style='border-collapse:collapse !important;border;0px;'><tr><td>" +
      //"<div style='width:20px;height:410px;display:inline-block; transform:rotateZ(-90deg);'>" +
      //    " Right potentiometer: &nbsp;Clockwise pot rotation &rarr;" +
      //    "</div></td><td>" +
      svg_svg({width:20, height:410, child_elements: [svg_text({x:0, y:380, transform: 'rotate(-90 15 380)',
               text:'Left potentiometer: &nbsp;Clockwise pot rotation &rarr;'
      })]}) + "</td><td>" +
      svg_svg({id: "svg_id", height: window.cal_svg_height, width: window.cal_svg_height,
                   html_class: "clickable", style:"background-color:white;",
                   child_elements: [
                       svg_text({text: "X   Axis", x: 150, y: 400, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;'}),
                       svg_text({text: "Y   Axis", x:  30, y: 250, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;', transform: 'rotate(-90 30 250)'}),

                   ]}) +
      "</td></tr><tr style='border-collapse:collapse;'><td style='border-collapse:collapse;'></td><td>&nbsp;&nbsp;&nbsp;&nbsp;Right potentiometer: &nbsp;Clockwise pot rotation &rarr;</td></tr>" +
      "</table></td></tr></table>" +
  "3. <input type='button' id='calibrate_optical_id' style='margin-top:10px;' " +
             "value='Calibrate optical encoders'/> Do each time you turn on Dexter.",
   callback: handle_cal
  })
  open_doc(calibrate_doc_id)
}