const API =
 location.hostname === "localhost"
   ? "http://localhost:3000"
   : "https://spotify-songs-backend-krsd.onrender.com"; // your production URL here
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function sendOtp(){
  const res = await fetch(`${API}/api/auth/send-otp-register`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:document.getElementById("email").value})
  });

  const data = await res.json();
  alert(data.message);
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function verifyOtp(){
  const res = await fetch(`${API}/api/auth/verify-otp-register`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    credentials:"include",
    body:JSON.stringify({
      username:document.getElementById("ruser").value,
      email:document.getElementById("email").value,
      password:document.getElementById("rpass").value,
      role:document.getElementById("rrole").value,
      otp:document.getElementById("otp").value
    })
  });

  const data = await res.json();
  alert(data.message);

  if(res.ok){
    window.location.href="login.html";
  }
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function forgot(){
  window.location.href="forgot.html";
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function sendForgot(){
  const res = await fetch(`${API}/api/auth/send-otp-forgot`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      email:document.getElementById("femail").value
    })
  });

  const data = await res.json();
  alert(data.message);
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
async function reset(){
  const res = await fetch(`${API}/api/auth/reset-password`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      email:document.getElementById("femail").value,
      otp:document.getElementById("fotp").value,
      newPassword:document.getElementById("newpass").value
    })
  });

  const data = await res.json();
  alert(data.message);
}



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Registration
const registerBtn=document.getElementById("register-account");                                    //+++++++++++++++++   this whole function is useless  +++++++++++++++++++++++//
if(registerBtn){
    registerBtn.addEventListener("click", async function(e) {
        e.preventDefault();
        showLoader();
        const res=await fetch(`${API}/api/auth/register`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            credentials:"include",
            body:JSON.stringify({
                username:ruser.value,
                email:remail.value,
                password:rpass.value,
                role:rrole.value
            })
        })
        const data=await res.json()
        alert(data.message);
        if(res.ok) {window.location.href = "login.html";}                                        //+++++++++++++++++   this whole function is useless  +++++++++++++++++++++++//
        hideLoader();
    });
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Login
const loginBtn = document.getElementById("login-account");

if (loginBtn) {
  loginBtn.addEventListener("click", async function(e){
    e.preventDefault();
    showLoader();
    const res = await fetch(`${API}/api/auth/login`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include",
      body:JSON.stringify({
        email:document.getElementById("lemail").value,
        password:document.getElementById("lpass").value
      })
    });

    const data = await res.json();
    alert(data.message);

    if(res.ok){
      localStorage.setItem("user", JSON.stringify(data.user));
      if(data.user.role === "artist"){
        window.location.href="artist-profile.html";
      } 
      else if(data.user.role === "user"){
        window.location.href="user-profile.html";
      }
    }
    hideLoader();
  });
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Logout
const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async function(){
    showLoader();
    await fetch(`${API}/api/auth/logout`,{
      method:"POST",
      credentials:"include"
    });
    alert("Logged out successfully");
    localStorage.removeItem("user");
    window.location.href="login.html";
    hideLoader();
  });
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const pageHeading = document.getElementById("page-heading");

if(pageHeading){
  const user = JSON.parse(localStorage.getItem("user"));
  if(user){
    pageHeading.innerHTML = `Welcome ${user.username}`;
  }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function loadUserCount(){
  try{
    const res = await fetch(`${API}/api/auth/count`);
    const data = await res.json();

    const el = document.getElementById("user-count");
    if(el){
      el.innerText = `Total registered users: ${data.count}`;
    }
  }catch(err){
    console.log("Count fetch error", err);
  }
}

loadUserCount();
setInterval(loadUserCount, 120000);


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function showLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.classList.remove("hidden");
}

function hideLoader(){
  const loader = document.getElementById("loader");
  if(loader) loader.classList.add("hidden");
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function checkLogin(){

  // run only on public pages
  const path = window.location.pathname.toLowerCase();

  const isPublicPage =
      path.endsWith("index.html") ||
      path.endsWith("login.html") ||
      path.endsWith("register.html") ||
      path === "/" ||
      path === "";

  if(!isPublicPage) return;

  showLoader();

  try{
    const res = await fetch(`${API}/api/auth/me`,{
      method:"GET",
      credentials:"include"
    });

    if(!res.ok){
      hideLoader();
      return;
    }

    const data = await res.json();

    if(data?.user){
      localStorage.setItem("user", JSON.stringify(data.user));
      
      const path = window.location.pathname;

      // If on index page → just alert
      if (path.includes("index.html") || path === "/") {
          alert("Already logged in. To register a new account, logout first.");
          hideLoader();
          // return;
      }
     
      // small delay so loader shows nicely
      setTimeout(()=>{
        if(data.user.role === "artist"){
          window.location.replace("artist-profile.html");
        } else {
          window.location.replace("user-profile.html");
        }
      }, 500);
    }
    else{
      hideLoader();
    }

  }catch(err){
    hideLoader();
  }
}

checkLogin();
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




