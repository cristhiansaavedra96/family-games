import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function Carton5x5({ card, drawn, marked, onToggle, compact, cellAspect }) {
  const gridBorder = '#e6e6f0';
  return (
  <View style={{ borderWidth: 0, paddingTop: compact ? 6 : 8, paddingBottom: 6, paddingHorizontal: 6, backgroundColor: '#ffffff', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 }}>
      {/* Header B I N G O */}
      <View style={{ flexDirection: 'row', marginBottom: 4, paddingHorizontal: 8 }}>
        {['B','I','N','G','O'].map((h, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', fontSize: 11, letterSpacing: 2, color: ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93'][i] }}>{h}</Text>
          </View>
        ))}
      </View>
  <View style={{ borderWidth: 0, borderColor: gridBorder, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden', marginHorizontal: 0 }}>
        {card.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((n, c) => {
              const isCenter = r === 2 && c === 2;
              const isCellMarked = Boolean(marked?.[r]?.[c]);
              const showCircle = !isCenter && isCellMarked;
              const bg = '#ffffff';
              const textColor = showCircle ? '#ffffff' : '#2d3436';
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.8}
                  onPress={() => onToggle && onToggle(r, c)}
                  disabled={isCenter}
                  style={{ flex: 1, aspectRatio: (cellAspect || (compact ? 0.95 : 1)), alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderLeftWidth: c === 0 ? 0 : 1, borderTopWidth: r === 0 ? 0 : 1, borderColor: gridBorder }}>
                  {/* círculo overlay absoluto para evitar deformaciones */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
                    <View style={{ width: '58%', aspectRatio: 1, borderRadius: 999, backgroundColor: showCircle ? '#e53935' : 'transparent', borderWidth: showCircle ? 2 : 0, borderColor: '#ffffff' }} />
                  </View>
                  {/* número encima */}
                  <Text style={{ fontSize: 20, fontWeight: '600', letterSpacing: -0.2, color: isCenter ? '#2d3436' : textColor }}>
                    {isCenter ? '★' : n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
