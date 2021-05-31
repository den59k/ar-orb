const match_threshold = 70

export function match_pattern(targetDescriptors, sourceDescriptors, matches) {
  const q_cnt = targetDescriptors.rows;
  const query_u32 = targetDescriptors.buffer.i32; // cast to integer buffer
  let qd_off = 0;
  let num_matches = 0;

  for(let qidx = 0; qidx < q_cnt; qidx++) {
    let best_dist = 256;
    let best_dist2 = 256;
    let best_idx = -1;
    let best_lev = -1;

    for(let lev = 0; lev < sourceDescriptors.length; lev++) {
      let lev_descr = sourceDescriptors[lev];
      let ld_cnt = lev_descr.rows;
      let ld_i32 = lev_descr.buffer.i32; // cast to integer buffer
      let ld_off = 0;

      for(let pidx = 0; pidx < ld_cnt; pidx++) {

        var curr_d = 0;
        // Дескриптор содержит 32 бита, то есть 8 Integers
        for(let k=0; k < 8; k++) 
          curr_d += popcnt32( query_u32[qd_off+k]^ld_i32[ld_off+k] );

        if(curr_d < best_dist) {
          best_dist2 = best_dist;
          best_dist = curr_d;
          best_lev = lev;
          best_idx = pidx;
        } else if(curr_d < best_dist2) {
          best_dist2 = curr_d;
        }

        ld_off += 8; // Переходим к следующему дескриптору
      }
    }

    // filter out by some threshold
    if(
      best_dist < match_threshold &&
      best_dist < 0.65*best_dist2
    ) {
      matches[num_matches].screen_idx = qidx;
      matches[num_matches].pattern_lev = best_lev;
      matches[num_matches].pattern_idx = best_idx;
      num_matches++;
    }

    qd_off += 8; // Переходим к следующему дескриптору
  }

  return num_matches;
}

function popcnt32(n) {
	n -= ((n >> 1) & 0x55555555);
	n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
	return (((n + (n >> 4))& 0xF0F0F0F)* 0x1010101) >> 24;
}