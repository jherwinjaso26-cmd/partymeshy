const Renderer = {
    activeTerrain: "cyber",
    pulseTime: 0,
    mapW: 1400,
    mapH: 1000,
    
    // Paints unique backgrounds and terrains based on the host configuration
    paintRichThematicFloor: function(ctx) {
        ctx.save();
        if (this.activeTerrain === 'volcano') {
            ctx.fillStyle = '#1c1010'; 
            ctx.fillRect(0, 0, this.mapW, this.mapH);
            ctx.fillStyle = '#7f1d1d';
            for (let i = 0; i < this.mapW; i += 240) {
                ctx.beginPath(); 
                ctx.moveTo(i, 0);
                ctx.quadraticCurveTo(i + 100 + Math.sin(this.pulseTime) * 50, this.mapH / 2, i - 60, this.mapH);
                ctx.lineTo(i + 60, this.mapH);
                ctx.quadraticCurveTo(i + 160 + Math.sin(this.pulseTime) * 50, this.mapH / 2, i + 120, 0); 
                ctx.fill();
            }
        } else if (this.activeTerrain === 'jungle') {
            ctx.fillStyle = '#061f12'; 
            ctx.fillRect(0, 0, this.mapW, this.mapH);
            ctx.fillStyle = '#1c140c';
            for (let y = 0; y < this.mapH; y += 160) { 
                ctx.fillRect(0, y + Math.sin(y + this.pulseTime) * 20, this.mapW, 40); 
            }
        } else {
            ctx.fillStyle = '#03050c'; 
            ctx.fillRect(0, 0, this.mapW, this.mapH);
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.2)'; 
            ctx.lineWidth = 2;
            for (let x = 0; x < this.mapW; x += 100) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.mapH); ctx.stroke();
            }
            for (let y = 0; y < this.mapH; y += 100) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.mapW, y); ctx.stroke();
            }
        }
        ctx.restore();
    },

    // Renders custom terrain barriers and handles hard-difficulty traps
    renderThematicObstacleBlock: function(ctx, obs) {
        if (obs.phaseState === 'hidden') return; 
        
        ctx.save();
        ctx.globalAlpha = 1.0; 
        
        if (this.activeTerrain === 'volcano') {
            if (obs.type === 'magma_vent') {
                let grad = ctx.createRadialGradient(obs.x + 30, obs.y + 30, 4, obs.x + 30, obs.y + 30, 32);
                grad.addColorStop(0, '#fef08a'); 
                grad.addColorStop(1, '#450a0a');
                ctx.fillStyle = grad; 
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            } else {
                ctx.fillStyle = '#292524'; 
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = '#ef4444'; 
                ctx.lineWidth = 2; 
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
            }
        } else if (this.activeTerrain === 'jungle') {
            if (obs.type === 'ancient_tree') {
                ctx.fillStyle = '#064e3b'; 
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.fillStyle = '#ffffff'; 
                ctx.font = '24px Arial'; 
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText('🌳', obs.x + 16, obs.y + 14);
            } else {
                ctx.fillStyle = '#44403c'; 
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            }
        } else {
            ctx.fillStyle = '#1e1b4b'; 
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.strokeStyle = '#06b6d4'; 
            ctx.lineWidth = 2; 
            ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }

        // Draw spikes overlay layer over a hard difficulty spike trap block setup
        if (obs.type === 'spike_trap') {
            ctx.fillStyle = '#78716c'; 
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.fillStyle = '#ffffff'; 
            ctx.font = '20px Arial'; 
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('⚠️', obs.x + 18, obs.y + 16);
        }
        ctx.restore();
    },

    // Draws pointer arrows on the screen edge highlighting off-screen bomb holders
    drawRadarCompass: function(ctx, localPlayer, currentPositions, canvasW, canvasH, myUsername) {
        if (!localPlayer) return;
        for (let name in currentPositions) {
            let target = currentPositions[name];
            if (target && target.isIt && name !== myUsername && !target.isDead) {
                let dx = target.x - localPlayer.x;
                let dy = target.y - localPlayer.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                // Draw tracking arrows only when carriers escape direct display field view
                if (distance > 380) {
                    let angle = Math.atan2(dy, dx);
                    let arrowX = canvasW / 2 + Math.cos(angle) * 160;
                    let arrowY = canvasH / 2 + Math.sin(angle) * 160;
                    
                    ctx.save(); 
                    ctx.translate(arrowX, arrowY); 
                    ctx.rotate(angle); 
                    ctx.fillStyle = '#ef4444'; 
                    ctx.beginPath(); 
                    ctx.moveTo(18, 0); 
                    ctx.lineTo(-12, -12); 
                    ctx.lineTo(-5, 0); 
                    ctx.lineTo(-12, 12); 
                    ctx.closePath(); 
                    ctx.fill(); 
                    ctx.restore();
                }
            }
        }
    }
};

window.Renderer = Renderer;
