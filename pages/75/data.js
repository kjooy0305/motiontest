// Blockbench 5.1.6 기준 — 앱 소스(GPL-3.0)에서 액션 ID·기본 단축키·공식 한국어 라벨을 추출해 생성
const AUTO = {
 "ver": "5.1.6",
 "keys": [
  {
   "id": "navigate",
   "ko": "화면 조작·기본",
   "items": [
    {
     "k": "좌클릭",
     "n": "선택",
     "i": "preview_select",
     "d": "",
     "v": [
      {
       "m": "ctrl",
       "n": "여러 개 선택"
      },
      {
       "m": "shift",
       "n": "그룹 전체 선택"
      },
      {
       "m": "alt",
       "n": "루프 선택"
      }
     ]
    },
    {
     "k": "좌클릭",
     "n": "보는 각도 조정",
     "i": "preview_rotate",
     "d": "",
     "v": []
    },
    {
     "k": "우클릭",
     "n": "드래그 보기",
     "i": "preview_drag",
     "d": "",
     "v": []
    },
    {
     "k": "Shift + 좌클릭",
     "n": "확대 보기",
     "i": "preview_zoom",
     "d": "",
     "v": []
    },
    {
     "k": "마우스 휠",
     "n": "화면 확대·축소",
     "i": "preview_scroll_zoom",
     "d": "",
     "v": []
    },
    {
     "k": "Ctrl + 마우스 휠",
     "n": "UV·2D 에디터 확대·축소",
     "i": "uv_editor_scroll_zoom",
     "d": "",
     "v": []
    },
    {
     "k": "Ctrl + [Shift] + 좌클릭",
     "n": "영역 선택",
     "i": "preview_area_select",
     "d": "",
     "v": []
    },
    {
     "k": "Enter",
     "n": "확인",
     "i": "confirm",
     "d": "",
     "v": []
    },
    {
     "k": "Esc",
     "n": "취소",
     "i": "cancel",
     "d": "",
     "v": []
    }
   ]
  },
  {
   "id": "tools",
   "ko": "도구",
   "items": [
    {
     "k": "V",
     "n": "이동",
     "i": "move_tool",
     "d": "선택 및 이동 도구",
     "v": []
    },
    {
     "k": "S",
     "n": "크기 조정",
     "i": "resize_tool",
     "d": "선택 및 크기 조절 도구",
     "v": []
    },
    {
     "k": "R",
     "n": "회전",
     "i": "rotate_tool",
     "d": "선택한 요소를 회전하는 도구",
     "v": []
    },
    {
     "k": "P",
     "n": "회전 중심 도구",
     "i": "pivot_tool",
     "d": "큐브 및 뼈대의 회전 중심 포인트를 변경하는 도구",
     "v": []
    },
    {
     "k": "X",
     "n": "꼭짓점 맞춤",
     "i": "vertex_snap_tool",
     "d": "두 큐브를 꼭짓점을 기준으로 맞춥니다",
     "v": []
    },
    {
     "k": "Alt + S",
     "n": "늘이기",
     "i": "stretch_tool",
     "d": "Tool to select and stretch elements",
     "v": []
    },
    {
     "k": "Space",
     "n": "교환 도구",
     "i": "swap_tools",
     "d": "이동 및 크기 조정 도구 간 전환",
     "v": []
    },
    {
     "k": "B",
     "n": "페인트 브러시",
     "i": "brush_tool",
     "d": "표면 또는 UV 에디터의 비트맵 텍스쳐에 칠을 하는 도구",
     "v": []
    },
    {
     "k": "E",
     "n": "지우개",
     "i": "eraser",
     "d": "투명하게 지우는 지우개",
     "v": []
    },
    {
     "k": "U",
     "n": "모양 그리기",
     "i": "draw_shape_tool",
     "d": "텍스쳐에 간단한 모양을 그리는 도구",
     "v": []
    },
    {
     "k": "M",
     "n": "복사·붙여넣기 도구",
     "i": "copy_paste_tool",
     "d": "",
     "v": []
    },
    {
     "k": "M",
     "n": "선택 도구",
     "i": "selection_tool",
     "d": "Select parts of the image",
     "v": [
      {
       "m": "shift",
       "n": "선택 영역에 더하기"
      },
      {
       "m": "ctrl",
       "n": "선택 영역에서 빼기"
      }
     ]
    },
    {
     "k": "Shift + V",
     "n": "레이어 이동",
     "i": "move_layer_tool",
     "d": "Move the current layer or selection",
     "v": []
    }
   ]
  },
  {
   "id": "edit",
   "ko": "편집",
   "items": [
    {
     "k": "Ctrl + C",
     "n": "복사",
     "i": "copy",
     "d": "선택한 범위 복사",
     "v": [
      {
       "m": "shift",
       "n": "전체(모든 요소·채널) 대상"
      }
     ]
    },
    {
     "k": "Ctrl + X",
     "n": "잘라내기",
     "i": "cut",
     "d": "선택한 범위 잘라내기",
     "v": [
      {
       "m": "shift",
       "n": "전체(모든 요소·채널) 대상"
      }
     ]
    },
    {
     "k": "Ctrl + V",
     "n": "붙여넣기",
     "i": "paste",
     "d": "선택한 범위 붙여넣기",
     "v": [
      {
       "m": "shift",
       "n": "전체(모든 요소·채널) 대상"
      }
     ]
    },
    {
     "k": "F2",
     "n": "이름 바꾸기",
     "i": "rename",
     "d": "선택된 큐브 이름 바꾸기",
     "v": []
    },
    {
     "k": "Delete",
     "n": "삭제",
     "i": "delete",
     "d": "",
     "v": [
      {
       "m": "alt",
       "n": "정점·모서리는 남기고 면만 삭제"
      }
     ]
    },
    {
     "k": "Ctrl + D",
     "n": "복제",
     "i": "duplicate",
     "d": "",
     "v": []
    },
    {
     "k": "Shift + R",
     "n": "루프 자르기",
     "i": "loop_cut",
     "d": "선택한 모서리를 가로지르는 루프에서 메쉬 분할함",
     "v": []
    },
    {
     "k": "Shift + M",
     "n": "정점 병합",
     "i": "merge_vertices",
     "d": "선택한 정점을 처음 선택한 정점의 위치에 병합",
     "v": []
    },
    {
     "k": "Shift + F",
     "n": "표면이나 모서리 생성",
     "i": "create_face",
     "d": "선택한 정점 사이에 새 표면 또는 모서리를 작성함",
     "v": []
    },
    {
     "k": "Shift + E",
     "n": "선택 압출",
     "i": "extrude_mesh_selection",
     "d": "메쉬의 선택된 부분을 압출합니다",
     "v": []
    },
    {
     "k": "Shift + I",
     "n": "인셋 삽입",
     "i": "inset_mesh_selection",
     "d": "선택한 메쉬의 부위를 삽입합니다",
     "v": []
    },
    {
     "k": "Shift + E",
     "n": "스플라인 압출",
     "i": "extrude_spline_selection",
     "d": "Extrude the selected handle on all splines",
     "v": []
    },
    {
     "k": "F4",
     "n": "아웃라이너 추가 옵션",
     "i": "outliner_toggle",
     "d": "외곽선 추가 옵션 스위치 전환",
     "v": []
    },
    {
     "k": "Ctrl + F",
     "n": "조건으로 선택",
     "i": "select_window",
     "d": "속성 기반 큐브 선택 및 검색",
     "v": []
    },
    {
     "k": "Shift + E",
     "n": "아마추어 본 추가",
     "i": "add_armature_bone",
     "d": "Adds a bone to the armature",
     "v": []
    },
    {
     "k": "Ctrl + G",
     "n": "그룹 추가",
     "i": "add_group",
     "d": "새로운 그룹 또는 뼈대 추가",
     "v": []
    },
    {
     "k": "Ctrl + Shift + G",
     "n": "그룹 요소",
     "i": "group_elements",
     "d": "선택된 요소를 새 그룹으로 모으기",
     "v": []
    },
    {
     "k": "Ctrl + Z",
     "n": "되돌리기",
     "i": "undo",
     "d": "마지막으로 진행한 작업 취소",
     "v": []
    },
    {
     "k": "Ctrl + Y",
     "n": "실행 취소",
     "i": "redo",
     "d": "마지막 되돌리기 작업 취소",
     "v": []
    }
   ]
  },
  {
   "id": "select",
   "ko": "선택",
   "items": [
    {
     "k": "Ctrl + A",
     "n": "모두 선택",
     "i": "select_all",
     "d": "",
     "v": []
    },
    {
     "k": "Ctrl + I",
     "n": "선택 반전",
     "i": "invert_selection",
     "d": "현재 선택된 큐브 반전",
     "v": []
    },
    {
     "k": "Ctrl + L",
     "n": "컬렉션 만들기",
     "i": "create_collection",
     "d": "Create a collection out of the outliner selection",
     "v": []
    }
   ]
  },
  {
   "id": "transform",
   "ko": "변환·이동",
   "items": [
    {
     "k": "←",
     "n": "키 프레임을 뒤로 옮기기",
     "i": "move_keyframe_back",
     "d": "",
     "v": []
    },
    {
     "k": "→",
     "n": "키 프레임을 앞으로 이동",
     "i": "move_keyframe_forth",
     "d": "",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + ↑",
     "n": "그래프에서 키프레임 값 올리기",
     "i": "move_graph_keyframes_up",
     "d": "",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + ↓",
     "n": "그래프에서 키프레임 값 내리기",
     "i": "move_graph_keyframes_down",
     "d": "",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + ↑",
     "n": "위로",
     "i": "move_up",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 위로 이동",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + ↓",
     "n": "아래로",
     "i": "move_down",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 아래로 이동",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + ←",
     "n": "옆으로",
     "i": "move_left",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 왼쪽으로 이동",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + →",
     "n": "오른쪽으로",
     "i": "move_right",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 오른쪽으로 이동",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + PageUp",
     "n": "앞으로",
     "i": "move_forth",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 앞으로 이동",
     "v": []
    },
    {
     "k": "[Ctrl] + [Shift] + PageDown",
     "n": "뒤로",
     "i": "move_back",
     "d": "선택한 큐브를 현재 카메라 각도에 대해 뒤로 이동",
     "v": []
    }
   ]
  },
  {
   "id": "view",
   "ko": "보기·화면",
   "items": [
    {
     "k": "F11",
     "n": "전체 화면",
     "i": "fullscreen",
     "d": "전체 화면 전환",
     "v": []
    },
    {
     "k": "Ctrl + B",
     "n": "사이드바 전환",
     "i": "toggle_sidebars",
     "d": "사이드바 활성화 또는 비활성화",
     "v": []
    },
    {
     "k": "I",
     "n": "선택만 남기고 숨기기",
     "i": "hide_everything_except_selection",
     "d": "선택한 요소를 제외한 모든 요소에 대한 가시성을 전환함",
     "v": []
    },
    {
     "k": "Z",
     "n": "뷰 모드",
     "i": "view_mode",
     "d": "모델 보기 모드 전환",
     "v": []
    },
    {
     "k": "T",
     "n": "체커보드 프리뷰",
     "i": "preview_checkerboard",
     "d": "미리보기 뒤에 있는 체크보드 배경 전환",
     "v": []
    },
    {
     "k": "G",
     "n": "픽셀 격자",
     "i": "pixel_grid",
     "d": "Show texture pixel grid on elements in edit mode",
     "v": []
    },
    {
     "k": "Numpad 5",
     "n": "원근/정사영 전환",
     "i": "toggle_camera_projection",
     "d": "원근법과 직교법 사이에 카메라 투영 전환",
     "v": []
    },
    {
     "k": "Numpad 1",
     "n": "첫 각도(정면)",
     "i": "camera_initial",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 8",
     "n": "위에서 보기",
     "i": "camera_top",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 2",
     "n": "아래에서 보기",
     "i": "camera_bottom",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 4",
     "n": "남쪽에서 보기",
     "i": "camera_south",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 6",
     "n": "북쪽에서 보기",
     "i": "camera_north",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 7",
     "n": "동쪽에서 보기",
     "i": "camera_east",
     "d": "",
     "v": []
    },
    {
     "k": "Numpad 9",
     "n": "서쪽에서 보기",
     "i": "camera_west",
     "d": "",
     "v": []
    },
    {
     "k": "Ctrl + P",
     "n": "스크린샷 모델",
     "i": "screenshot_model",
     "d": "현재 각도에서 모델 스크린샷 자르기",
     "v": []
    },
    {
     "k": "G",
     "n": "격자 칠하기",
     "i": "painting_grid",
     "d": "페인트 모드에서 텍스쳐가 있는 큐브에 격자 표시",
     "v": []
    }
   ]
  },
  {
   "id": "file",
   "ko": "파일",
   "items": [
    {
     "k": "Ctrl + Alt + S",
     "n": "프로젝트 저장",
     "i": "save_project",
     "d": "현재 프로젝트를 파일로 저장",
     "v": []
    },
    {
     "k": "Shift + Alt + S",
     "n": "번호 붙여 프로젝트 저장",
     "i": "save_project_incremental",
     "d": "Saves the current model as a project file with an increment (ex: project_2.bbmodel)",
     "v": []
    },
    {
     "k": "Ctrl + Shift + Alt + S",
     "n": "다른 이름으로 프로젝트 저장",
     "i": "save_project_as",
     "d": "새로운 곳에 현재 프로젝트를 저장",
     "v": []
    },
    {
     "k": "Ctrl + O",
     "n": "모델 열기",
     "i": "open_model",
     "d": "내 컴퓨터에서 모델 찾기",
     "v": []
    },
    {
     "k": "Ctrl + S",
     "n": "모델 저장",
     "i": "export_over",
     "d": "파일을 덮어쓰고 모델, 텍스쳐 및 애니메이션 저장",
     "v": []
    },
    {
     "k": "Ctrl + W",
     "n": "프로젝트 닫기",
     "i": "close_project",
     "d": "현재 열려있는 프로젝트 닫기",
     "v": []
    },
    {
     "k": "Ctrl + Tab",
     "n": "탭 전환",
     "i": "switch_tabs",
     "d": "열려있는 탭들로 이동합니다. Shift를 눌러 반대 방향으로 이동할 수 있음",
     "v": [
      {
       "m": "shift",
       "n": "역순으로"
      }
     ]
    }
   ]
  },
  {
   "id": "animation",
   "ko": "애니메이션",
   "items": [
    {
     "k": "Ctrl + End",
     "n": "애니메이션 끝 설정",
     "i": "set_animation_end",
     "d": "선택한 애니메이션의 끝을 현재 타임라인 시간으로 설정",
     "v": []
    },
    {
     "k": "Space",
     "n": "컨트롤러 미리보기",
     "i": "animation_controller_preview_mode",
     "d": "",
     "v": []
    },
    {
     "k": "Q",
     "n": "키프레임 추가",
     "i": "add_keyframe",
     "d": "자동으로 키 프레임을 추가합니다. 쉬프트를 눌러 강제로 기본 값으로 합니다.",
     "v": [
      {
       "m": "shift",
       "n": "기본값으로 강제 생성"
      }
     ]
    },
    {
     "k": "F3",
     "n": "그래프 에디터 전환",
     "i": "timeline_graph_editor",
     "d": "그래프 편집기 뷰와 키프레임 뷰 사이의 타임라인 전환",
     "v": []
    },
    {
     "k": "Space",
     "n": "애니메이션 재생",
     "i": "play_animation",
     "d": "애니메이션 미리 보기",
     "v": []
    },
    {
     "k": "Home",
     "n": "애니메이션 시작 지점으로",
     "i": "jump_to_timeline_start",
     "d": "",
     "v": []
    },
    {
     "k": "End",
     "n": "애니메이션 마침 지점으로",
     "i": "jump_to_timeline_end",
     "d": "",
     "v": []
    },
    {
     "k": ",",
     "n": "1 프레임 뒤로 보내기",
     "i": "timeline_frame_back",
     "d": "",
     "v": []
    },
    {
     "k": ".",
     "n": "1 프레임 앞으로 보내기",
     "i": "timeline_frame_forth",
     "d": "",
     "v": []
    },
    {
     "k": "Ctrl + M",
     "n": "마커 설정",
     "i": "add_marker",
     "d": "타임라인 표시하기",
     "v": []
    }
   ]
  },
  {
   "id": "paint",
   "ko": "칠하기",
   "items": [
    {
     "k": "[Shift]",
     "n": "보조 색으로 칠하기",
     "i": "paint_secondary_color",
     "d": "",
     "v": []
    }
   ]
  },
  {
   "id": "textures",
   "ko": "텍스처",
   "items": [
    {
     "k": "Ctrl + T",
     "n": "텍스쳐 불러오기",
     "i": "import_texture",
     "d": "내 파일에서 하나 이상의 텍스쳐 가져오기",
     "v": []
    },
    {
     "k": "Ctrl + Shift + T",
     "n": "텍스쳐 생성",
     "i": "create_texture",
     "d": "빈 텍스쳐 또는 템플릿 텍스쳐 생성",
     "v": []
    }
   ]
  },
  {
   "id": "uv",
   "ko": "UV",
   "items": [
    {
     "k": "Alt + U",
     "n": "커서 위치로 UV 이동",
     "i": "move_uv_to_cursor",
     "d": "Move the selected UV faces to the mouse cursor position",
     "v": []
    }
   ]
  },
  {
   "id": "color",
   "ko": "색상",
   "items": [
    {
     "k": "X",
     "n": "주/보조 색 교환",
     "i": "swap_colors",
     "d": "Swap the main color with the secondary color",
     "v": []
    }
   ]
  },
  {
   "id": "blockbench",
   "ko": "앱",
   "items": [
    {
     "k": "F",
     "n": "액션 컨트롤(명령 검색)",
     "i": "action_control",
     "d": "사용 가능한 모든 행동을 검색하고 실행",
     "v": []
    }
   ]
  },
  {
   "id": "",
   "ko": "기타",
   "items": [
    {
     "k": "Ctrl + Shift + I",
     "n": "개발자 도구 열기",
     "i": "open_dev_tools",
     "d": "",
     "v": []
    }
   ]
  }
 ],
 "menus": [
  {
   "id": "file",
   "n": "파일",
   "items": [
    {
     "t": "a",
     "n": "프로젝트...",
     "k": "",
     "d": "모델의 메타데이터를 편집할 수 있는 프로젝트 창 열기",
     "i": "project_window"
    },
    {
     "t": "g",
     "n": "새 모델",
     "c": []
    },
    {
     "t": "g",
     "n": "최근 작업물",
     "c": []
    },
    {
     "t": "a",
     "n": "모델 열기",
     "k": "Ctrl + O",
     "d": "내 컴퓨터에서 모델 찾기",
     "i": "open_model"
    },
    {
     "t": "a",
     "n": "링크로 모델 열기",
     "k": "",
     "d": "blckbn.ch URL에서 모델 열기",
     "i": "open_from_link"
    },
    {
     "t": "a",
     "n": "새 창",
     "k": "",
     "d": "새로운 Blockbench 창 열기",
     "i": "new_window"
    },
    {
     "t": "a",
     "n": "프로젝트 저장",
     "k": "Ctrl + Alt + S",
     "d": "현재 프로젝트를 파일로 저장",
     "i": "save_project"
    },
    {
     "t": "a",
     "n": "다른 이름으로 프로젝트 저장",
     "k": "Ctrl + Shift + Alt + S",
     "d": "새로운 곳에 현재 프로젝트를 저장",
     "i": "save_project_as"
    },
    {
     "t": "a",
     "n": "번호 붙여 프로젝트 저장",
     "k": "Shift + Alt + S",
     "d": "Saves the current model as a project file with an increment (ex: project_2.bbmodel)",
     "i": "save_project_incremental"
    },
    {
     "t": "a",
     "n": "프로젝트 포맷 변환",
     "k": "",
     "d": "현재 프로젝트를 다른 파일 형식으로 변환",
     "i": "convert_project"
    },
    {
     "t": "a",
     "n": "프로젝트 닫기",
     "k": "Ctrl + W",
     "d": "현재 열려있는 프로젝트 닫기",
     "i": "close_project"
    },
    {
     "t": "g",
     "n": "가져오기",
     "c": [
      {
       "t": "g",
       "n": "열린 프로젝트 가져오기",
       "c": []
      },
      {
       "t": "a",
       "n": "프로젝트 불러오기",
       "k": "",
       "d": ".bbmodel 파일에서 다른 프로젝트를 현재 프로젝트로 가져오기",
       "i": "import_project"
      },
      {
       "t": "a",
       "n": "Java 블록/아이템 모델 추가",
       "k": "",
       "d": "현재 모델에 json 파일로 부터 Minecraft Java 의 블록/아이템을 추가",
       "i": "import_java_block_model"
      },
      {
       "t": "a",
       "n": "OptiFine 부위 불러오기",
       "k": "",
       "d": "OptiFine을 위한 엔티티 부위 불러오기",
       "i": "import_optifine_part"
      },
      {
       "t": "a",
       "n": "베드락 어태처블 가져오기",
       "k": "",
       "d": "",
       "i": "import_bedrock_attachable"
      },
      {
       "t": "a",
       "n": "베드락 복셀 셰이프 가져오기",
       "k": "",
       "d": "Add a voxel shape from a json file to the current project",
       "i": "import_bedrock_voxel_shape"
      },
      {
       "t": "a",
       "n": "OBJ 모델 불러오기",
       "k": "",
       "d": "OBJ 모델에서 객체를 메쉬로 가져오기",
       "i": "import_obj"
      },
      {
       "t": "a",
       "n": "텍스처 압출",
       "k": "",
       "d": "텍스쳐를 늘려 모델 생성",
       "i": "extrude_texture"
      }
     ]
    },
    {
     "t": "g",
     "n": "내보내기",
     "c": [
      {
       "t": "a",
       "n": "블록/아이템 모델 내보내기",
       "k": "",
       "d": "마인크래프트 자바 에디션용 블록/아이템 모델 내보내기",
       "i": "export_blockmodel"
      },
      {
       "t": "a",
       "n": "베드락 지오메트리 내보내기",
       "k": "",
       "d": "베드락 지오메트리 파일로 모델 내보내기.",
       "i": "export_bedrock"
      },
      {
       "t": "a",
       "n": "베드락 엔티티 내보내기",
       "k": "",
       "d": "현재 제작되어있는 모델을 엔티티 모델 (mobs.json) 로 저장",
       "i": "export_entity"
      },
      {
       "t": "a",
       "n": "베드락 복셀 셰이프 내보내기",
       "k": "",
       "d": "Export the bounding boxes in the project as a bedrock voxel shape file",
       "i": "export_bedrock_voxel_shape"
      },
      {
       "t": "a",
       "n": "Java 엔티티 내보내기",
       "k": "",
       "d": "Java classs로 엔티티 모델 내보내기",
       "i": "export_class_entity"
      },
      {
       "t": "a",
       "n": "OptiFine JEM 내보내기",
       "k": "",
       "d": "OptiFine 엔티티 모델 전체 내보내기",
       "i": "export_optifine_full"
      },
      {
       "t": "a",
       "n": "OptiFine 부위 내보내기",
       "k": "",
       "d": "OptiFine 엔티티 모델 부위 단일 내보내기",
       "i": "export_optifine_part"
      },
      {
       "t": "a",
       "n": "마인크래프트 스킨 내보내기",
       "k": "",
       "d": "마인크래프트 스킨 PNG로 내보내기",
       "i": "export_minecraft_skin"
      },
      {
       "t": "a",
       "n": "이미지 내보내기",
       "k": "",
       "d": "Export your texture as an image file",
       "i": "export_image"
      },
      {
       "t": "a",
       "n": "glTF 모델로 내보내기",
       "k": "",
       "d": "모델과 애니메이션을 공유와 렌더링을 위한 glTF 파일로 내보내기",
       "i": "export_gltf"
      },
      {
       "t": "a",
       "n": ".OBJ 내보내기",
       "k": "",
       "d": "렌더링용 Wavefront 객체 내보내기",
       "i": "export_obj"
      },
      {
       "t": "a",
       "n": "FBX모델 내보내기",
       "k": "",
       "d": "다른 3D 응용 프로그램 및 게임 엔진에서 사용할 수 있도록 모델 및 애니메이션을 fbx 파일로 내보내기",
       "i": "export_fbx"
      },
      {
       "t": "a",
       "n": "STL 내보내기",
       "k": "",
       "d": "Export a STL model for 3D printing",
       "i": "export_stl"
      },
      {
       "t": "a",
       "n": "Collada 모델 (dae) 내보내기",
       "k": "",
       "d": "모델 및 애니메이션을 dae 파일로 내보내서 다른 3D 응용 프로그램에서 사용",
       "i": "export_collada"
      },
      {
       "t": "a",
       "n": "레거시 프로젝트 내보내기",
       "k": "",
       "d": "",
       "i": "export_legacy_project"
      },
      {
       "t": "a",
       "n": "모드 엔티티 애니메이션 내보내기",
       "k": "",
       "d": "Export animations for a Minecraft Java Edition modded entity model",
       "i": "export_modded_animations"
      },
      {
       "t": "a",
       "n": "Sketchfab 업로드",
       "k": "",
       "d": "Sketchfab에 자신의 모델 업로드",
       "i": "upload_sketchfab"
      },
      {
       "t": "a",
       "n": "공유하기...",
       "k": "",
       "d": "모델 공유 링크 생성",
       "i": "share_model"
      }
     ]
    },
    {
     "t": "a",
     "n": "모델 저장",
     "k": "Ctrl + S",
     "d": "파일을 덮어쓰고 모델, 텍스쳐 및 애니메이션 저장",
     "i": "export_over"
    },
    {
     "t": "a",
     "n": "에셋 압축파일 내보내기",
     "k": "",
     "d": "모델과 모든 텍스쳐가 포함된 압축 파일을 다운로드",
     "i": "export_asset_archive"
    },
    {
     "t": "g",
     "n": "사용자 설정",
     "c": [
      {
       "t": "a",
       "n": "환경 설정",
       "k": "",
       "d": "Blockbench 설정 대화 상자 열기",
       "i": "settings_window"
      },
      {
       "t": "a",
       "n": "단축키 설정",
       "k": "",
       "d": "",
       "i": "keybindings_window"
      },
      {
       "t": "a",
       "n": "테마 설정",
       "k": "",
       "d": "",
       "i": "theme_window"
      },
      {
       "t": "g",
       "n": "프로필",
       "c": []
      }
     ]
    },
    {
     "t": "a",
     "n": "플러그인 관리자",
     "k": "",
     "d": "플러그인 스토어 메뉴를 엽니다.",
     "i": "plugins_window"
    },
    {
     "t": "a",
     "n": "공동 편집 세션",
     "k": "",
     "d": "편집 세션에 연결하여 다른 사용자와 협업",
     "i": "edit_session"
    }
   ]
  },
  {
   "id": "edit",
   "n": "편집",
   "items": [
    {
     "t": "a",
     "n": "되돌리기",
     "k": "Ctrl + Z",
     "d": "마지막으로 진행한 작업 취소",
     "i": "undo"
    },
    {
     "t": "a",
     "n": "실행 취소",
     "k": "Ctrl + Y",
     "d": "마지막 되돌리기 작업 취소",
     "i": "redo"
    },
    {
     "t": "a",
     "n": "히스토리 수정...",
     "k": "",
     "d": "수정 히스토리와 실행 취소 또는 되돌리기 단계 보기",
     "i": "edit_history"
    },
    {
     "t": "a",
     "n": "요소 추가",
     "k": "",
     "d": "Add a new element from the list of element types",
     "i": "add_element"
    },
    {
     "t": "a",
     "n": "그룹 추가",
     "k": "Ctrl + G",
     "d": "새로운 그룹 또는 뼈대 추가",
     "i": "add_group"
    },
    {
     "t": "a",
     "n": "복제",
     "k": "Ctrl + D",
     "d": "",
     "i": "duplicate"
    },
    {
     "t": "a",
     "n": "이름 바꾸기",
     "k": "F2",
     "d": "선택된 큐브 이름 바꾸기",
     "i": "rename"
    },
    {
     "t": "a",
     "n": "찾기/바꾸기",
     "k": "",
     "d": "이름의 부위를 찾고 바꾸기",
     "i": "find_replace"
    },
    {
     "t": "a",
     "n": "모두 잠금 해제",
     "k": "",
     "d": "바깥쪽의 요소 잠금 해제",
     "i": "unlock_everything"
    },
    {
     "t": "a",
     "n": "삭제",
     "k": "Delete",
     "d": "",
     "i": "delete"
    },
    {
     "t": "a",
     "n": "미러 모델링 적용",
     "k": "",
     "d": "Apply Mirror Modeling to the selection. All selected elements will be copied and flipped across the X axis.",
     "i": "apply_mirror_modeling"
    },
    {
     "t": "a",
     "n": "비율 편집(소프트 선택)",
     "k": "",
     "d": "메쉬의 일부를 편집할 때 주변 정점에 비례적으로 영향을 줍니다",
     "i": "proportional_editing"
    },
    {
     "t": "a",
     "n": "미러 모델링",
     "k": "",
     "d": "Enable Mirror Modeling on the X axis. All changes you make in the viewport will be reflected to the other side, unless specifically disabled on the element.",
     "i": "mirror_modeling"
    },
    {
     "t": "a",
     "n": "조건으로 선택",
     "k": "Ctrl + F",
     "d": "속성 기반 큐브 선택 및 검색",
     "i": "select_window"
    },
    {
     "t": "a",
     "n": "모두 선택",
     "k": "Ctrl + A",
     "d": "",
     "i": "select_all"
    },
    {
     "t": "a",
     "n": "모두 선택 해제",
     "k": "",
     "d": "",
     "i": "unselect_all"
    },
    {
     "t": "a",
     "n": "선택 반전",
     "k": "Ctrl + I",
     "d": "현재 선택된 큐브 반전",
     "i": "invert_selection"
    }
   ]
  },
  {
   "id": "transform",
   "n": "변환",
   "items": [
    {
     "t": "a",
     "n": "크기 조정...",
     "k": "",
     "d": "선택된 큐브 크기",
     "i": "scale"
    },
    {
     "t": "g",
     "n": "회전",
     "c": [
      {
       "t": "a",
       "n": "X축 시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_x_cw"
      },
      {
       "t": "a",
       "n": "X축 반시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_x_ccw"
      },
      {
       "t": "a",
       "n": "Y축 시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_y_cw"
      },
      {
       "t": "a",
       "n": "Y축 반시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_y_ccw"
      },
      {
       "t": "a",
       "n": "Z축 시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_z_cw"
      },
      {
       "t": "a",
       "n": "Z축 반시계 방향 90° 회전",
       "k": "",
       "d": "",
       "i": "rotate_z_ccw"
      }
     ]
    },
    {
     "t": "g",
     "n": "뒤집기",
     "c": [
      {
       "t": "a",
       "n": "X축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_x"
      },
      {
       "t": "a",
       "n": "Y축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_y"
      },
      {
       "t": "a",
       "n": "Z축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_z"
      }
     ]
    },
    {
     "t": "g",
     "n": "중앙으로",
     "c": [
      {
       "t": "a",
       "n": "X축 중앙 정렬",
       "k": "",
       "d": "",
       "i": "center_x"
      },
      {
       "t": "a",
       "n": "Y축 중앙 정렬",
       "k": "",
       "d": "",
       "i": "center_y"
      },
      {
       "t": "a",
       "n": "Z축 중앙 정렬",
       "k": "",
       "d": "",
       "i": "center_z"
      },
      {
       "t": "a",
       "n": "중앙 측면",
       "k": "",
       "d": "선택한 요소를 X 및 Z축 중앙에 배치",
       "i": "center_lateral"
      }
     ]
    },
    {
     "t": "g",
     "n": "속성",
     "c": [
      {
       "t": "a",
       "n": "가시성 전환",
       "k": "",
       "d": "선택된 큐브 가시성 전환",
       "i": "toggle_visibility"
      },
      {
       "t": "a",
       "n": "잠금 여부 설정",
       "k": "",
       "d": "선택한 요소의 잠금 여부를 전환함",
       "i": "toggle_locked"
      },
      {
       "t": "a",
       "n": "내보내기 전환",
       "k": "",
       "d": "선택된 큐브 내보내기 설정 전환",
       "i": "toggle_export"
      },
      {
       "t": "a",
       "n": "자동 UV 전환",
       "k": "",
       "d": "선택된 큐브 자동 UV 전환",
       "i": "toggle_autouv"
      },
      {
       "t": "a",
       "n": "셰이딩 전환",
       "k": "",
       "d": "선택된 큐브 셰이딩 전환",
       "i": "toggle_shade"
      },
      {
       "t": "a",
       "n": "UV 반전",
       "k": "",
       "d": "선택한 큐브의 X축에서 UV 미러링 토글",
       "i": "toggle_mirror_uv"
      }
     ]
    }
   ]
  },
  {
   "id": "mesh",
   "n": "메쉬",
   "items": [
    {
     "t": "a",
     "n": "선택 압출",
     "k": "Shift + E",
     "d": "메쉬의 선택된 부분을 압출합니다",
     "i": "extrude_mesh_selection"
    },
    {
     "t": "a",
     "n": "인셋 삽입",
     "k": "Shift + I",
     "d": "선택한 메쉬의 부위를 삽입합니다",
     "i": "inset_mesh_selection"
    },
    {
     "t": "a",
     "n": "루프 자르기",
     "k": "Shift + R",
     "d": "선택한 모서리를 가로지르는 루프에서 메쉬 분할함",
     "i": "loop_cut"
    },
    {
     "t": "a",
     "n": "표면이나 모서리 생성",
     "k": "Shift + F",
     "d": "선택한 정점 사이에 새 표면 또는 모서리를 작성함",
     "i": "create_face"
    },
    {
     "t": "a",
     "n": "면 뒤집기",
     "k": "",
     "d": "선택한 면을 반전하여 반대 방향으로 향하게 함",
     "i": "invert_face"
    },
    {
     "t": "a",
     "n": "표면 크리스 전환",
     "k": "",
     "d": "Switch in which direction the quad folds in the middle",
     "i": "switch_face_crease"
    },
    {
     "t": "a",
     "n": "정점 병합",
     "k": "Shift + M",
     "d": "선택한 정점을 처음 선택한 정점의 위치에 병합",
     "i": "merge_vertices"
    },
    {
     "t": "a",
     "n": "모서리 녹이기",
     "k": "",
     "d": "선택한 모서리를 메쉬로 분해하고 분할한 면 병합",
     "i": "dissolve_edges"
    },
    {
     "t": "a",
     "n": "선택 면 두껍게",
     "k": "",
     "d": "Solidify the selected faces of the mesh",
     "i": "solidify_mesh_selection"
    },
    {
     "t": "a",
     "n": "정점 가중치 설정",
     "k": "",
     "d": "Set the vertex weights of the selected vertices to a specific value on a certain armature bone",
     "i": "set_vertex_weights"
    },
    {
     "t": "a",
     "n": "메쉬 회전 적용",
     "k": "",
     "d": "Reset the element rotation of the mesh, and apply it to the geometry instead",
     "i": "apply_mesh_rotation"
    },
    {
     "t": "a",
     "n": "메쉬 분리",
     "k": "",
     "d": "메쉬의 선택된 면을 새 메쉬로 분할",
     "i": "split_mesh"
    },
    {
     "t": "a",
     "n": "메쉬 병합",
     "k": "",
     "d": "여러개의 메쉬를 하나로 병합",
     "i": "merge_meshes"
    }
   ]
  },
  {
   "id": "skin",
   "n": "스킨",
   "items": [
    {
     "t": "a",
     "n": "사용자 자세 프리셋",
     "k": "",
     "d": "Load a custom skin pose preset",
     "i": "custom_skin_poses"
    },
    {
     "t": "a",
     "n": "현재 자세를 프리셋으로 저장",
     "k": "",
     "d": "Save the current pose of the model as a pose preset",
     "i": "add_custom_skin_pose"
    },
    {
     "t": "a",
     "n": "스킨 레이어 스위치",
     "k": "",
     "d": "스킨 모델의 모자와 옷 등의 레이어를 활성화 혹은 비활성화",
     "i": "toggle_skin_layer"
    },
    {
     "t": "a",
     "n": "스킨 모델 파괴",
     "k": "",
     "d": "덮인 표면을 편집할 수 있는 폭발 뷰 전환",
     "i": "explode_skin_model"
    },
    {
     "t": "a",
     "n": "슬림/와이드 스킨 변환",
     "k": "",
     "d": "Switch the skin model between the classic wide (steve) model and the slim (alex) model. Optionally auto-adjust the texture to fit the model",
     "i": "convert_minecraft_skin_variant"
    }
   ]
  },
  {
   "id": "image",
   "n": "이미지",
   "items": [
    {
     "t": "a",
     "n": "밝기 & 대조 조절...",
     "k": "",
     "d": "선택된 텍스쳐의 밝기와 대조를 조절",
     "i": "adjust_brightness_contrast"
    },
    {
     "t": "a",
     "n": "채도 & 색조 조절...",
     "k": "",
     "d": "선택된 텍스쳐의 채도와 색조를 조절",
     "i": "adjust_saturation_hue"
    },
    {
     "t": "a",
     "n": "불투명도 조정...",
     "k": "",
     "d": "선택한 텍스쳐의 불투명도를 조정",
     "i": "adjust_opacity"
    },
    {
     "t": "a",
     "n": "색 반전",
     "k": "",
     "d": "선택된 텍스쳐의 모든 색을 반전",
     "i": "invert_colors"
    },
    {
     "t": "a",
     "n": "커브(톤) 조절",
     "k": "",
     "d": "선택된 텍스쳐의 밝기 곡선을 조절",
     "i": "adjust_curves"
    },
    {
     "t": "a",
     "n": "팔레트 색으로 제한",
     "k": "",
     "d": "텍스쳐의 색상을 현재 로드된 팔레트에 있는 색상으로 제한합니다",
     "i": "limit_to_palette"
    },
    {
     "t": "a",
     "n": "RGBA 채널을 레이어로 분리",
     "k": "",
     "d": "Split the texture into additive layers, one for each RGBA channel",
     "i": "split_rgb_into_layers"
    },
    {
     "t": "a",
     "n": "알파 채널을 레이어로 분리",
     "k": "",
     "d": "Split the alpha channel of the texture into an alpha mask layer",
     "i": "split_alpha_into_layer"
    },
    {
     "t": "a",
     "n": "사용하지 않는 텍스처 영역 지우기",
     "k": "",
     "d": "Clear parts of the texture that are not UV-mapped to any elements",
     "i": "clear_unused_texture_space"
    },
    {
     "t": "a",
     "n": "수평으로 텍스쳐 뒤집기",
     "k": "",
     "d": "Flip the texture or layer horizontally",
     "i": "flip_texture_x"
    },
    {
     "t": "a",
     "n": "수직으로 텍스쳐 뒤집기",
     "k": "",
     "d": "Flip the texture or layer vertically",
     "i": "flip_texture_y"
    },
    {
     "t": "a",
     "n": "텍스쳐를 시계 방향으로 회전",
     "k": "",
     "d": "Rotate the texture or layer clockwise",
     "i": "rotate_texture_cw"
    },
    {
     "t": "a",
     "n": "텍스쳐를 시계 반대 방향으로 회전",
     "k": "",
     "d": "Rotate the texture or layer counter-clockwise",
     "i": "rotate_texture_ccw"
    },
    {
     "t": "a",
     "n": "텍스쳐 크기 조정...",
     "k": "",
     "d": "",
     "i": "resize_texture"
    },
    {
     "t": "a",
     "n": "선택 영역으로 텍스처 자르기",
     "k": "",
     "d": "",
     "i": "crop_texture_to_selection"
    }
   ]
  },
  {
   "id": "animation",
   "n": "애니메이션",
   "items": [
    {
     "t": "a",
     "n": "애니메이션 어니언 스킨",
     "k": "",
     "d": "Display an wireframe view of a different frame in the animation for reference",
     "i": "animation_onion_skin"
    },
    {
     "t": "a",
     "n": "어니언 스킨(선택 항목만)",
     "k": "",
     "d": "",
     "i": "animation_onion_skin_selective"
    },
    {
     "t": "a",
     "n": "모션 트레일 표시",
     "k": "",
     "d": "",
     "i": "toggle_motion_trails"
    },
    {
     "t": "a",
     "n": "모션 트레일 고정",
     "k": "",
     "d": "현재 선택된 그룹의 모션 트레일 잠구기",
     "i": "lock_motion_trail"
    },
    {
     "t": "a",
     "n": "마커 설정",
     "k": "Ctrl + M",
     "d": "타임라인 표시하기",
     "i": "add_marker"
    },
    {
     "t": "a",
     "n": "이펙트 애니메이터",
     "k": "",
     "d": "타임라인을 열어 소리 및 입자 효과를 추가",
     "i": "select_effect_animator"
    },
    {
     "t": "a",
     "n": "애니메이션 포즈 복사",
     "k": "",
     "d": "Copy all keyframes to replicate the current animation pose",
     "i": "copy_animation_pose"
    },
    {
     "t": "a",
     "n": "애니메이션 좌우 반전",
     "k": "",
     "d": "선택한 키프레임을 모델의 다른 면에 복사하여 애니메이션의 일부를 뒤집음",
     "i": "flip_animation"
    },
    {
     "t": "a",
     "n": "애니메이션 최적화",
     "k": "",
     "d": "Optimize the current animation and reduce the keyframe count",
     "i": "optimize_animation"
    },
    {
     "t": "a",
     "n": "애니메이터 재지정",
     "k": "",
     "d": "Select which animator targets which bone or element",
     "i": "retarget_animators"
    },
    {
     "t": "a",
     "n": "역운동학(IK) 베이크",
     "k": "",
     "d": "Bake the rotations applied by inverse kinematics into the selected animation",
     "i": "bake_ik_animation"
    },
    {
     "t": "a",
     "n": "애니메이션을 모델로 만들기",
     "k": "",
     "d": "현재 표시된 애니메이션 프레임을 모델로 만듭니다. 회전 및 위치만 적용하고 크기는 무시됩니다.",
     "i": "bake_animation_into_model"
    },
    {
     "t": "a",
     "n": "애니메이션 병합",
     "k": "",
     "d": "Merge the animation into another animation",
     "i": "merge_animation"
    },
    {
     "t": "a",
     "n": "애니메이션 파일 가져오기",
     "k": "",
     "d": "애니메이션 파일 가져오기",
     "i": "load_animation_file"
    },
    {
     "t": "a",
     "n": "모든 애니메이션 저장",
     "k": "",
     "d": "현재 로드 된 애니메이션 모두 저장",
     "i": "save_all_animations"
    },
    {
     "t": "a",
     "n": "애니메이션 파일 내보내기",
     "k": "",
     "d": "선택된 에니메이션들을 새로운 파일로 내보내기",
     "i": "export_animation_file"
    }
   ]
  },
  {
   "id": "keyframe",
   "n": "키프레임",
   "items": [
    {
     "t": "a",
     "n": "복사",
     "k": "Ctrl + C",
     "d": "선택한 범위 복사",
     "i": "copy"
    },
    {
     "t": "a",
     "n": "붙여넣기",
     "k": "Ctrl + V",
     "d": "선택한 범위 붙여넣기",
     "i": "paste"
    },
    {
     "t": "a",
     "n": "키프레임 추가",
     "k": "Q",
     "d": "자동으로 키 프레임을 추가합니다. 쉬프트를 눌러 강제로 기본 값으로 합니다.",
     "i": "add_keyframe"
    },
    {
     "t": "a",
     "n": "키프레임 열 생성",
     "k": "",
     "d": "키프레임이 이미 있는 경우, 현재 타임코드에서 타임라인의 모든 채널을 키",
     "i": "keyframe_column_create"
    },
    {
     "t": "a",
     "n": "모두 선택",
     "k": "Ctrl + A",
     "d": "",
     "i": "select_all"
    },
    {
     "t": "a",
     "n": "키프레임 열 선택",
     "k": "",
     "d": "플레이헤드 아래의 열을 따라 타임라인에서 모든 키프레임 선택",
     "i": "keyframe_column_select"
    },
    {
     "t": "a",
     "n": "키프레임 반전",
     "k": "",
     "d": "선택된 키프레임들의 순서를 반전시킵니다",
     "i": "reverse_keyframes"
    },
    {
     "t": "g",
     "n": "키프레임 뒤집기",
     "c": [
      {
       "t": "a",
       "n": "X축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_x"
      },
      {
       "t": "a",
       "n": "Y축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_y"
      },
      {
       "t": "a",
       "n": "Z축 기준 뒤집기",
       "k": "",
       "d": "",
       "i": "flip_z"
      }
     ]
    },
    {
     "t": "a",
     "n": "균일 스케일 키프레임",
     "k": "",
     "d": "선택된 키프레임에서 유니폼 스케일링 활성화",
     "i": "keyframe_uniform"
    },
    {
     "t": "a",
     "n": "키프레임 초기화",
     "k": "",
     "d": "선택한 키프레임의 모든 값을 재설정",
     "i": "reset_keyframe"
    },
    {
     "t": "a",
     "n": "키프레임 값 반올림",
     "k": "",
     "d": "Round all values of the selected keyframes",
     "i": "round_keyframe_values"
    },
    {
     "t": "a",
     "n": "키 프레임 재설정",
     "k": "",
     "d": "설정된 키 프레임의 수학 값을 재설정함",
     "i": "resolve_keyframe_expressions"
    },
    {
     "t": "a",
     "n": "삭제",
     "k": "Delete",
     "d": "",
     "i": "delete"
    }
   ]
  },
  {
   "id": "display",
   "n": "디스플레이",
   "items": [
    {
     "t": "a",
     "n": "복사",
     "k": "Ctrl + C",
     "d": "선택한 범위 복사",
     "i": "copy"
    },
    {
     "t": "a",
     "n": "붙여넣기",
     "k": "Ctrl + V",
     "d": "선택한 범위 붙여넣기",
     "i": "paste"
    },
    {
     "t": "a",
     "n": "새 사전 설정",
     "k": "",
     "d": "새로운 사전 표기 설정 추가",
     "i": "add_display_preset"
    },
    {
     "t": "a",
     "n": "기본 설정 적용하기",
     "k": "",
     "d": "기본 설정 혹은 커스텀 설정 적용하기",
     "i": "apply_display_preset"
    }
   ]
  },
  {
   "id": "tools",
   "n": "도구",
   "items": [
    {
     "t": "g",
     "n": "Toolbox",
     "c": []
    },
    {
     "t": "a",
     "n": "교환 도구",
     "k": "Space",
     "d": "이동 및 크기 조정 도구 간 전환",
     "i": "swap_tools"
    },
    {
     "t": "a",
     "n": "액션 컨트롤(명령 검색)",
     "k": "F",
     "d": "사용 가능한 모든 행동을 검색하고 실행",
     "i": "action_control"
    },
    {
     "t": "a",
     "n": "프레디케이트 오버라이드",
     "k": "",
     "d": "선택한 조건에 따라 이 모델을 재정의하려면 모델을 선택하세요.",
     "i": "predicate_overrides"
    },
    {
     "t": "a",
     "n": "메쉬로 변환",
     "k": "",
     "d": "선택한 요소를 메쉬로 변환함",
     "i": "convert_to_mesh"
    },
    {
     "t": "a",
     "n": "컬페이스 자동 설정",
     "k": "",
     "d": "인접한 블록에 의해 가려질 때 면을 숨기기 위해 후면 제거를 자동으로 생성합니다.",
     "i": "auto_set_cullfaces"
    },
    {
     "t": "a",
     "n": "빈 면 제거",
     "k": "",
     "d": "텍스쳐가 없는 모든 면 제거",
     "i": "remove_blank_faces"
    },
    {
     "t": "a",
     "n": "복셀 셰이프 생성",
     "k": "",
     "d": "",
     "i": "generate_voxel_shapes"
    },
    {
     "t": "a",
     "n": "충돌/선택 박스 컴포넌트 복사",
     "k": "",
     "d": "Generate a collision or selection box component for Minecraft Bedrock Edition blocks",
     "i": "generate_bedrock_block_box"
    },
    {
     "t": "a",
     "n": "충돌/히트박스 컴포넌트 복사",
     "k": "",
     "d": "Generate a collision or custom hit test component for Minecraft Bedrock Edition entities",
     "i": "generate_bedrock_entity_box"
    },
    {
     "t": "a",
     "n": "베드락 멀티블록 분할",
     "k": "",
     "d": "",
     "i": "slice_bedrock_multiblock"
    }
   ]
  },
  {
   "id": "view",
   "n": "보기",
   "items": [
    {
     "t": "a",
     "n": "전체 화면",
     "k": "F11",
     "d": "전체 화면 전환",
     "i": "fullscreen"
    },
    {
     "t": "g",
     "n": "Panels",
     "c": []
    },
    {
     "t": "a",
     "n": "사이드바 전환",
     "k": "Ctrl + B",
     "d": "사이드바 활성화 또는 비활성화",
     "i": "toggle_sidebars"
    },
    {
     "t": "a",
     "n": "화면 분할",
     "k": "",
     "d": "Select a viewport split screen mode",
     "i": "split_screen"
    },
    {
     "t": "a",
     "n": "뷰 모드",
     "k": "Z",
     "d": "모델 보기 모드 전환",
     "i": "view_mode"
    },
    {
     "t": "a",
     "n": "셰이딩 켜기/끄기",
     "k": "",
     "d": "",
     "i": "toggle_shading"
    },
    {
     "t": "a",
     "n": "모든 격자 켜기/끄기",
     "k": "",
     "d": "",
     "i": "toggle_all_grids"
    },
    {
     "t": "a",
     "n": "바닥면 켜기/끄기",
     "k": "",
     "d": "",
     "i": "toggle_ground_plane"
    },
    {
     "t": "a",
     "n": "체커보드 프리뷰",
     "k": "T",
     "d": "미리보기 뒤에 있는 체크보드 배경 전환",
     "i": "preview_checkerboard"
    },
    {
     "t": "a",
     "n": "픽셀 격자",
     "k": "G",
     "d": "Show texture pixel grid on elements in edit mode",
     "i": "pixel_grid"
    },
    {
     "t": "a",
     "n": "격자 칠하기",
     "k": "G",
     "d": "페인트 모드에서 텍스쳐가 있는 큐브에 격자 표시",
     "i": "painting_grid"
    },
    {
     "t": "a",
     "n": "베드락 애니메이션 모드",
     "k": "",
     "d": "마인크래프트 베드락에디션의 에니매이션을 편집할 모드를 선택",
     "i": "bedrock_animation_mode"
    },
    {
     "t": "a",
     "n": "씬 프리셋",
     "k": "",
     "d": "모델 미리보기 씬 변경하기",
     "i": "preview_scene"
    },
    {
     "t": "a",
     "n": "참조 이미지 편집",
     "k": "",
     "d": "참조용 이미지 모드를 켜서 참조용 이미지와 청사진을 추가하거나 편집함",
     "i": "edit_reference_images"
    },
    {
     "t": "a",
     "n": "선택만 남기고 숨기기",
     "k": "I",
     "d": "선택한 요소를 제외한 모든 요소에 대한 가시성을 전환함",
     "i": "hide_everything_except_selection"
    },
    {
     "t": "a",
     "n": "선택 항목으로 시점 이동",
     "k": "",
     "d": "현재 선택 중심으로 카메라 정렬",
     "i": "focus_on_selection"
    },
    {
     "t": "g",
     "n": "스크린샷",
     "c": []
    },
    {
     "t": "a",
     "n": "스크린샷 모델",
     "k": "Ctrl + P",
     "d": "현재 각도에서 모델 스크린샷 자르기",
     "i": "screenshot_model"
    },
    {
     "t": "a",
     "n": "앱 전체 스크린샷",
     "k": "",
     "d": "애플리케이션 전체 스크린샷",
     "i": "screenshot_app"
    },
    {
     "t": "a",
     "n": "고급 스크린샷",
     "k": "",
     "d": "Take a screenshot of the model with advanced options",
     "i": "advanced_screenshot"
    },
    {
     "t": "a",
     "n": "GIF로 녹화",
     "k": "",
     "d": "현재 각도에서 모델의 애니메이션 GIF 녹화",
     "i": "record_model_gif"
    },
    {
     "t": "a",
     "n": "타임랩스 기록",
     "k": "",
     "d": "모델 제작의 진행 등의 모든 행동들을 기록합니다.",
     "i": "timelapse"
    }
   ]
  },
  {
   "id": "help",
   "n": "도움말",
   "items": [
    {
     "t": "g",
     "n": "검색 후 실행 동작",
     "c": []
    },
    {
     "t": "g",
     "n": "빠른시작 마법사",
     "c": []
    },
    {
     "t": "g",
     "n": "디스코드 서버",
     "c": []
    },
    {
     "t": "g",
     "n": "Blockbench 위키",
     "c": []
    },
    {
     "t": "g",
     "n": "문제 신고",
     "c": []
    },
    {
     "t": "a",
     "n": "백업 파일 보기",
     "k": "",
     "d": "Browse the list of auto-saved project backups",
     "i": "view_backups"
    },
    {
     "t": "g",
     "n": "개발진",
     "c": [
      {
       "t": "a",
       "n": "플러그인 새로고침",
       "k": "",
       "d": "모든 개발 플러그인 새로 고침",
       "i": "reload_plugins"
      },
      {
       "t": "g",
       "n": "플러그인 API 문서",
       "c": []
      },
      {
       "t": "a",
       "n": "개발자 도구 열기",
       "k": "Ctrl + Shift + I",
       "d": "",
       "i": "open_dev_tools"
      },
      {
       "t": "g",
       "n": "공장 초기화",
       "c": []
      },
      {
       "t": "g",
       "n": "Unlock Projects",
       "c": []
      },
      {
       "t": "g",
       "n": "캐쉬 리로드",
       "c": []
      },
      {
       "t": "a",
       "n": "Blockbench 새로 고침",
       "k": "",
       "d": "Blockbench 새로 고침. 저장되지 않은 변경 사항은 복구할 수 없음",
       "i": "reload"
      }
     ]
    },
    {
     "t": "a",
     "n": "레이아웃 초기화",
     "k": "",
     "d": "Blockbench 기본으로 레이아웃 초기화",
     "i": "reset_layout"
    },
    {
     "t": "a",
     "n": "Blockbench 정보",
     "k": "",
     "d": "",
     "i": "about_window"
    }
   ]
  }
 ],
 "tools": [
  {
   "i": "move_tool",
   "n": "이동",
   "k": "V",
   "d": "선택 및 이동 도구",
   "m": "edit"
  },
  {
   "i": "resize_tool",
   "n": "크기 조정",
   "k": "S",
   "d": "선택 및 크기 조절 도구",
   "m": "edit"
  },
  {
   "i": "rotate_tool",
   "n": "회전",
   "k": "R",
   "d": "선택한 요소를 회전하는 도구",
   "m": "edit"
  },
  {
   "i": "pivot_tool",
   "n": "회전 중심 도구",
   "k": "P",
   "d": "큐브 및 뼈대의 회전 중심 포인트를 변경하는 도구",
   "m": "edit"
  },
  {
   "i": "vertex_snap_tool",
   "n": "꼭짓점 맞춤",
   "k": "X",
   "d": "두 큐브를 꼭짓점을 기준으로 맞춥니다",
   "m": "edit"
  },
  {
   "i": "stretch_tool",
   "n": "늘이기",
   "k": "Alt + S",
   "d": "Tool to select and stretch elements",
   "m": "edit"
  },
  {
   "i": "knife_tool",
   "n": "나이프 도구",
   "k": "",
   "d": "Tool to cut mesh faces into smaller pieces",
   "m": "edit"
  },
  {
   "i": "seam_tool",
   "n": "잇기 도구",
   "k": "",
   "d": "메쉬 모서리에 UV 잇기를 정의하는 도구",
   "m": "edit"
  },
  {
   "i": "weight_brush",
   "n": "가중치 브러시",
   "k": "",
   "d": "Paint vertex weights on meshes for armature deformations",
   "m": "edit"
  },
  {
   "i": "pan_tool",
   "n": "팬 도구",
   "k": "",
   "d": "뷰포트와 텍스쳐 에디터를 찾는 도구",
   "m": "all"
  },
  {
   "i": "brush_tool",
   "n": "페인트 브러시",
   "k": "B",
   "d": "표면 또는 UV 에디터의 비트맵 텍스쳐에 칠을 하는 도구",
   "m": "paint"
  },
  {
   "i": "copy_brush",
   "n": "브러시 복사",
   "k": "",
   "d": "브러시로 텍스쳐의 일부를 복제하거나 패턴을 그립니다. Ctrl 키를 누른 상태에서 클릭하여 복사 할 곳을 선택합니다.",
   "m": "paint"
  },
  {
   "i": "fill_tool",
   "n": "채우기",
   "k": "",
   "d": "한 면을 선택한 색상으로 채우기",
   "m": "paint"
  },
  {
   "i": "eraser",
   "n": "지우개",
   "k": "E",
   "d": "투명하게 지우는 지우개",
   "m": "paint"
  },
  {
   "i": "color_picker",
   "n": "색 추출",
   "k": "",
   "d": "색 지정 도구",
   "m": "paint"
  },
  {
   "i": "draw_shape_tool",
   "n": "모양 그리기",
   "k": "U",
   "d": "텍스쳐에 간단한 모양을 그리는 도구",
   "m": "paint"
  },
  {
   "i": "gradient_tool",
   "n": "그라데이션 도구",
   "k": "",
   "d": "텍스쳐에 그라데이션 색상 생성",
   "m": "paint"
  },
  {
   "i": "copy_paste_tool",
   "n": "복사·붙여넣기 도구",
   "k": "M",
   "d": "",
   "m": "paint"
  },
  {
   "i": "selection_tool",
   "n": "선택 도구",
   "k": "M",
   "d": "Select parts of the image",
   "m": "paint"
  },
  {
   "i": "move_layer_tool",
   "n": "레이어 이동",
   "k": "Shift + V",
   "d": "Move the current layer or selection",
   "m": "paint"
  }
 ],
 "formats": [
  {
   "i": "bedrock",
   "n": "베드락 모델",
   "en": "Bedrock Entity",
   "d": "베드락 에디션을 위한 모델 형식"
  },
  {
   "i": "bedrock_block",
   "n": "베드락 블록",
   "en": "Bedrock Block",
   "d": "마인크래프트 베드락 에디션을 위한 블록 모델"
  },
  {
   "i": "bedrock_old",
   "n": "베드락 레거시 모델",
   "en": "Bedrock Legacy Model",
   "d": "Pre-1.12 베드락 에디션 엔티티 모델"
  },
  {
   "i": "free",
   "n": "자유 모델",
   "en": "Generic Model",
   "d": "게임 엔진이나 렌더링 등을 위한 제한 없는 모델"
  },
  {
   "i": "image",
   "n": "이미지",
   "en": "Image",
   "d": "2D 이미지 편집기에서 이미지 편집"
  },
  {
   "i": "java_block",
   "n": "자바 블록/아이템",
   "en": "Java Block/Item",
   "d": "자바 에디션을 위한 모델 형식입니다."
  },
  {
   "i": "modded_entity",
   "n": "수정된 엔티티",
   "en": "Modded Entity",
   "d": "마인크래프트 모드를 위한 엔티티 모델입니다. .java 클래스 파일로 내보낼 수 있습니다."
  },
  {
   "i": "optifine_entity",
   "n": "OptiFine 엔티티",
   "en": "OptiFine Entity",
   "d": "OptiFine 모드를 위한 커스텀 엔티티 모델 형식"
  },
  {
   "i": "optifine_part",
   "n": "OptiFine 부위",
   "en": "OptiFine Part",
   "d": "OptiFine 엔티티 모델을 위한 JPM 부위"
  },
  {
   "i": "skin",
   "n": "마인크래프트 스킨",
   "en": "Minecraft Skin",
   "d": "플레이어, 엔티티 스킨 수정"
  }
 ],
 "panels": {
  "chat": "채팅",
  "uv": "UV",
  "layers": "레이어",
  "textures": "텍스처",
  "color": "색상",
  "palette": "팔레트",
  "outliner": "아웃라이너",
  "bone": "뼈대",
  "timeline": "타임라인",
  "animations": "애니메이션",
  "keyframe": "키프레임",
  "variable_placeholders": "변수 플레이스홀더",
  "animation_controllers": "애니메이션 컨트롤러",
  "display": "디스플레이",
  "skin_pose": "자세",
  "collections": "컬렉션",
  "transform": "변형",
  "element": "요소"
 },
 "elems": [
  {
   "i": "add_cube",
   "n": "큐브",
   "d": "새로운 큐브 추가",
   "k": ""
  },
  {
   "i": "add_mesh",
   "n": "메쉬",
   "d": "새로운 메쉬 추가",
   "k": ""
  },
  {
   "i": "add_group",
   "n": "그룹",
   "d": "새로운 그룹 또는 뼈대 추가",
   "k": "Ctrl + G"
  },
  {
   "i": "add_locator",
   "n": "로케이터",
   "d": "입자, 리쉬 등을 제어하기 위한 새 로케이터 추가",
   "k": ""
  },
  {
   "i": "add_null_object",
   "n": "빈 객체",
   "d": "새 빈 객체를 추가합니다",
   "k": ""
  },
  {
   "i": "add_texture_mesh",
   "n": "텍스쳐 메쉬",
   "d": "새로운 텍스쳐 메쉬 추가",
   "k": ""
  },
  {
   "i": "add_billboard",
   "n": "빌보드",
   "d": "Adds a new billboard, a flat element that always faces towards the camera",
   "k": ""
  },
  {
   "i": "add_bounding_box",
   "n": "바운딩 박스",
   "d": "Adds a new bounding box",
   "k": ""
  },
  {
   "i": "add_spline",
   "n": "스플라인",
   "d": "Adds a new spline",
   "k": ""
  },
  {
   "i": "add_armature",
   "n": "아마추어",
   "d": "Adds an armature that allows deforming a mesh via animation",
   "k": ""
  },
  {
   "i": "add_armature_bone",
   "n": "아마추어 본",
   "d": "Adds a bone to the armature",
   "k": "Shift + E"
  },
  {
   "i": "add_reference_image",
   "n": "참조용 이미지",
   "d": "",
   "k": ""
  }
 ]
};
