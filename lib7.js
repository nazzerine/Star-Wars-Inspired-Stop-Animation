
//////////////////////////////////////////////////////////////////////////////////////////
//
// THIS IS THE SUPPORT LIBRARY.  YOU PROBABLY DON'T WANT TO CHANGE ANYTHING HERE JUST YET.
//
//////////////////////////////////////////////////////////////////////////////////////////


let Mat4 = function() {
      const IDENTITY = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
      let stack = [ IDENTITY ], sp = 0;

      let c = Math.cos;
      let s = Math.sin;

      this.value = () => stack[sp];               // RETURN VALUE ON TOP OF MATRIX STACK
      this.identity = () => stack[sp] = IDENTITY; // METHOD TO SET VALUE TO IDENTITY MATRIX
      this.save      = () => {                    // PUSH A COPY OF VALUE ON TOP OF MATRIX STACK
         let value = [];
      	 for (let n = 0 ; n < 16 ; n++)
      	    value.push(stack[sp][n]);
      	    stack[++sp] = value;
      }
      this.restore   = () => sp--;                // POP TOP VALUE OFF THE MATRIX STACK

      this.matrixMultiply = (x,y) =>
      {
        let a = [];
        for (let i = 0; i < 4; i++)
        {
          for (let j = 0; j < 4; j++)
          {
            let note = 0.0;
            for (let z = 0; z < 4; z++)
              note = note + x[i*4+z] * y[z*4+j];
            a[i*4+j] = note;
          }
        }
        return a;
      }

      this.translate = (x,y,z) => {
        if (y == undefined) y = x;
        if (z == undefined) z = x;
        stack[sp] = this.matrixMultiply(stack[sp],[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        return stack[sp];
      }
      this.rotateX   = theta => {
        stack[sp] = this.matrixMultiply(stack[sp],[1,0,0,0, 0,c(theta),s(theta),0, 0,-s(theta),c(theta),0, 0,0,0,1]);
        return stack[sp];
      }
      this.rotateY   = theta => {
        stack[sp] = this.matrixMultiply(stack[sp],[c(theta),0,s(theta),0, 0,1,0,0, -s(theta),0,c(theta),0, 0,0,0,1]);
        return stack[sp];
      }
      this.rotateZ   = theta => {
        stack[sp] = this.matrixMultiply(stack[sp],[c(theta),s(theta),0,0, -s(theta),c(theta),0,0, 0,0,1,0, 0,0,0,1]);
        return stack[sp];
      }
      this.scale     = (x,y,z) => {
        if (y == undefined) y = x;
        if (z == undefined) z = x;
        stack[sp] = this.matrixMultiply(stack[sp],[x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
        return stack[sp];
      }
   }

var fragmentShaderHeader = [''
,'   precision highp float;'
,'   vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }'
,'   vec4 mod289(vec4 x) { return x - floor(x * (1. / 289.)) * 289.; }'
,'   vec4 permute(vec4 x) { return mod289(((x*34.)+1.)*x); }'
,'   vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - .85373472095314 * r; }'
,'   vec3 fade(vec3 t) { return t*t*t*(t*(t*6.-15.)+10.); }'
,'   float noise(vec3 P) {'
,'      vec3 i0 = mod289(floor(P)), i1 = mod289(i0 + vec3(1.)),'
,'           f0 = fract(P), f1 = f0 - vec3(1.), f = fade(f0);'
,'      vec4 ix = vec4(i0.x, i1.x, i0.x, i1.x), iy = vec4(i0.yy, i1.yy),'
,'           iz0 = i0.zzzz, iz1 = i1.zzzz,'
,'           ixy = permute(permute(ix) + iy), ixy0 = permute(ixy + iz0), ixy1 = permute(ixy + iz1),'
,'           gx0 = ixy0 * (1. / 7.), gy0 = fract(floor(gx0) * (1. / 7.)) - .5,'
,'           gx1 = ixy1 * (1. / 7.), gy1 = fract(floor(gx1) * (1. / 7.)) - .5;'
,'      gx0 = fract(gx0); gx1 = fract(gx1);'
,'      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0), sz0 = step(gz0, vec4(0.)),'
,'           gz1 = vec4(0.5) - abs(gx1) - abs(gy1), sz1 = step(gz1, vec4(0.));'
,'      gx0 -= sz0 * (step(0., gx0) - .5); gy0 -= sz0 * (step(0., gy0) - .5);'
,'      gx1 -= sz1 * (step(0., gx1) - .5); gy1 -= sz1 * (step(0., gy1) - .5);'
,'      vec3 g0 = vec3(gx0.x,gy0.x,gz0.x), g1 = vec3(gx0.y,gy0.y,gz0.y),'
,'           g2 = vec3(gx0.z,gy0.z,gz0.z), g3 = vec3(gx0.w,gy0.w,gz0.w),'
,'           g4 = vec3(gx1.x,gy1.x,gz1.x), g5 = vec3(gx1.y,gy1.y,gz1.y),'
,'           g6 = vec3(gx1.z,gy1.z,gz1.z), g7 = vec3(gx1.w,gy1.w,gz1.w);'
,'      vec4 norm0 = taylorInvSqrt(vec4(dot(g0,g0), dot(g2,g2), dot(g1,g1), dot(g3,g3))),'
,'           norm1 = taylorInvSqrt(vec4(dot(g4,g4), dot(g6,g6), dot(g5,g5), dot(g7,g7)));'
,'      g0 *= norm0.x; g2 *= norm0.y; g1 *= norm0.z; g3 *= norm0.w;'
,'      g4 *= norm1.x; g6 *= norm1.y; g5 *= norm1.z; g7 *= norm1.w;'
,'      vec4 nz = mix(vec4(dot(g0, vec3(f0.x, f0.y, f0.z)), dot(g1, vec3(f1.x, f0.y, f0.z)),'
,'                         dot(g2, vec3(f0.x, f1.y, f0.z)), dot(g3, vec3(f1.x, f1.y, f0.z))),'
,'                    vec4(dot(g4, vec3(f0.x, f0.y, f1.z)), dot(g5, vec3(f1.x, f0.y, f1.z)),'
,'                         dot(g6, vec3(f0.x, f1.y, f1.z)), dot(g7, vec3(f1.x, f1.y, f1.z))), f.z);'
,'      return 2.2 * mix(mix(nz.x,nz.z,f.y), mix(nz.y,nz.w,f.y), f.x);'
,'   }'
,'   float turbulence(vec3 P) {'              // Turbulence is a fractal sum of abs(noise).
,'      float f = 0., s = 1.;'                // The domain is rotated after every iteration
,'      for (int i = 0 ; i < 9 ; i++) {'      //    to avoid any visible grid artifacts.
,'         f += abs(noise(s * P)) / s;'
,'         s *= 2.;'
,'         P = vec3(.866 * P.x + .5 * P.z, P.y + 100., -.5 * P.x + .866 * P.z);'
,'      }'
,'      return f;'
,'   }'
,'   float ray_sphere(vec3 V, vec3 W, vec4 sphere) {'
,'      V -= sphere.xyz;'
,'      float r = sphere.w;'
,'      float WV = dot(W, V);'
,'      float discr = WV * WV - dot(V, V) + r * r;'
,'      return discr >= 0. ? -WV - sqrt(discr) : -1.;'
,'   }'
].join('\n');

var nfsh = fragmentShaderHeader.split('\n').length; // NUMBER OF LINES OF CODE IN fragmentShaderHeader

var isFirefox = navigator.userAgent.indexOf('Firefox') > 0;
var errorMsg = '';

let stride = 3;
let triMesh = [-1,-1,0, -1,1,0, 1,-1,0, .8,.8,0];

function gl_start(canvas, vertexShader, fragmentShader) {           // START WEBGL RUNNING IN A CANVAS

   setTimeout(function() {
      try {
         canvas.gl = canvas.getContext('experimental-webgl');              // Make sure WebGl is supported.
      } catch (e) { throw 'Sorry, your browser does not support WebGL.'; }

      canvas.setShaders = function(vertexShader, fragmentShader) {         // Add the vertex and fragment shaders:

         gl = this.gl, program = gl.createProgram();                        // Create the WebGL program.

         function addshader(type, src) {                                        // Create and attach a WebGL shader.
            function spacer(color, width, height) {
               return '<table bgcolor=' + color +
                            ' width='   + width +
                            ' height='  + height + '><tr><td>&nbsp;</td></tr></table>';
            }
            errorMessage.innerHTML = '<br>';
            errorMarker.innerHTML = spacer('black', 1, 1) + '<font size=5 color=black>\u25B6</font>';
            var shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
               let msg = gl.getShaderInfoLog(shader);
               console.log('Cannot compile shader:\n\n' + msg);

               let a = msg.substring(6, msg.length);
               if (a.substring(0, 3) == ' 0:') {
                  a = a.substring(3, a.length);
                  let line = parseInt(a) - nfsh + 1;
                  let nPixels = isFirefox ? 17 * line - 10 : 18 * line - 1;
                  errorMarker.innerHTML = spacer('black', 1, nPixels) + '<font size=5>\u25B6</font>';
               }

               let j = a.indexOf(':');
               a = a.substring(j+2, a.length);
               if ((j = a.indexOf('\n')) > 0)
                  a = a.substring(0, j);
               errorMessage.innerHTML = a;
            }
            gl.attachShader(program, shader);
         };

         addshader(gl.VERTEX_SHADER  , vertexShader  );                         // Add the vertex and fragment shaders.
         addshader(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentShader);

         gl.linkProgram(program);                                               // Link the program, report any errors.
         if (! gl.getProgramParameter(program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(program);
         gl.program = program;

         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

         gl.enable    (gl.DEPTH_TEST);
         gl.depthFunc (gl.GEQUAL);
         gl.clearDepth(-1.0);

         var aPos = gl.getAttribLocation(program, 'aPos');
         var aTan = gl.getAttribLocation(program, 'aTan'); // WE REPLACED THE aNor VERTEX ATTRIBUTE BY TWO ATTRIBUTES
         var aBin = gl.getAttribLocation(program, 'aBin'); // aTan AND aBin, TO REPRESENT TANGENT AND BINORMAL.
         var aUV  = gl.getAttribLocation(program, 'aUV' );

         gl.enableVertexAttribArray(aPos);
         gl.enableVertexAttribArray(aTan);
         gl.enableVertexAttribArray(aBin);
         gl.enableVertexAttribArray(aUV );

	 let bpe = Float32Array.BYTES_PER_ELEMENT

         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, stride * bpe, 0 * bpe); // NOW WE HAVE 11 VALUES IN EACH
         gl.vertexAttribPointer(aTan, 3, gl.FLOAT, false, stride * bpe, 3 * bpe); // VERTEX, RATHER THAN JUST 8.
         gl.vertexAttribPointer(aBin, 3, gl.FLOAT, false, stride * bpe, 6 * bpe);
         gl.vertexAttribPointer(aUV , 2, gl.FLOAT, false, stride * bpe, 9 * bpe);
      }

      canvas.setShaders(vertexShader, fragmentShader);                     // Initialize everything,

      canvas.mouseInfo = [0,0,0];
      canvas.addEventListener('mousemove', function(e) {
         let r = this.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
         this.mouseInfo[0] = 2 * x / r.width - 1;
         this.mouseInfo[1] = (r.height - 2 * y) / r.width;
      });
      canvas.addEventListener('mousedown', function(e) { this.mouseInfo[2] = 1; });
      canvas.addEventListener('mouseup'  , function(e) { this.mouseInfo[2] = 0; });

      setInterval(function() {                                             // Start the animation loop.
         gl = canvas.gl;
         if (gl.startTime === undefined)                                            // First time through,
            gl.startTime = Date.now();                                              //    record the start time.
         gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
         animate(gl);
         //gl.drawArrays(gl.TRIANGLE_STRIP, 0, triMesh.length / stride); // --NO LONGER NEEDED
      }, 30);

   }, 100); // Wait 100 milliseconds after page has loaded before starting WebGL.
}

let drawMesh = (m, mesh, material) => {
   setUniform('Matrix4fv', 'uMat', false, m.value());
   setUniform('Matrix4fv', 'uM', false, material);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh), gl.STATIC_DRAW);
   gl.drawArrays(gl.TRIANGLE_STRIP, 0, mesh.length / stride);
}

function animate() { }

var gl;
function setUniform(type, name, a, b, c, d, e, f) {
   let loc = gl.getUniformLocation(gl.program, name);
   (gl['uniform' + type])(loc, a, b, c, d, e, f);
}
