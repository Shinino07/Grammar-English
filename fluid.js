{
  const cv = document.getElementById('fluid');
  const gl = cv && cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
  const FS = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;
void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
  vec2 q=p*2.3+m*.7;
  float T=t*.22;
  for(float i=1.;i<6.;i++){
    q.x+=.62/i*sin(i*q.y+T+.3*i);
    q.y+=.5/i*cos(i*q.x-T*1.25+.5*i);
  }
  float a=.5+.5*sin(q.x+q.y*.6);
  float b=.5+.5*sin(q.y*1.4-T);
  vec3 blue=vec3(.0,.44,.89),sky=vec3(.39,.82,1.),mint=vec3(.42,.9,.8),peach=vec3(1.,.72,.55);
  vec3 col=mix(mix(blue,sky,a),mix(mint,peach,a),b*b*.85);
  col+=.08*sin(q.x*3.)*vec3(1.);
  vec2 e=p*vec2(.72,1.08)+.05*vec2(sin(T*2.+p.y*3.),cos(T*1.6+p.x*3.));
  float k=smoothstep(.52,.1,length(e));
  gl_FragColor=vec4(clamp(col,0.,1.)*k,k);
}`;
  const fail = () => { if (cv) cv.classList.add('nogl'); };
  if (!gl) fail();
  else {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) fail();
    else {
      gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'm');
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
      let W = 1, H = 1, mx = 0, my = 0, tx = 0, ty = 0, vis = true, raf = 0;
      const frame = ms => {
        mx += (tx - mx) * .035; my += (ty - my) * .035;
        gl.uniform2f(uR, W, H); gl.uniform1f(uT, ms / 1000); gl.uniform2f(uM, mx, my);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      const loop = ms => { frame(ms); raf = vis && !document.hidden ? requestAnimationFrame(loop) : 0; };
      const kick = () => { if (!still && vis && !raf && !document.hidden) raf = requestAnimationFrame(loop); };
      const size = () => {
        const d = Math.min(window.devicePixelRatio || 1, 1.5) * .7;
        W = Math.max(1, Math.round(cv.clientWidth * d)); H = Math.max(1, Math.round(cv.clientHeight * d));
        cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
        if (still) frame(5000); else kick();
      };
      const fluidRO = new ResizeObserver(size);
      fluidRO.observe(cv);
      const fluidIO = new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; kick(); });
      fluidIO.observe(cv);
      document.addEventListener('visibilitychange', kick);
      window.addEventListener('pointermove', e => {
        const b = cv.getBoundingClientRect();
        if (!b.width) return;
        tx = Math.max(-1, Math.min(1, (e.clientX - b.left) / b.width - .5));
        ty = Math.max(-1, Math.min(1, .5 - (e.clientY - b.top) / b.height));
      }, { passive: true });
    }
  }
}
