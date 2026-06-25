(function () {
  "use strict";

  window.CIFLord = window.CIFLord || {};

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function symmetrySymbolHtml(symbol) {
    if (!symbol) {
      return "";
    }

    if (symbol === "'" || symbol === "''" || symbol === "'''") {
      return escapeHtml(symbol);
    }

    return "<sup>" + escapeHtml(symbol) + "</sup>";
  }

  function atomLabelHtml(atom) {
    if (!atom || !atom.symmetrySymbol) {
      return escapeHtml(atom ? atom.label : "");
    }

    return escapeHtml(atom.label) + symmetrySymbolHtml(atom.symmetrySymbol);
  }

  function setText(id, text, cls) {
    var el = $(id);

    if (!el) {
      return;
    }

    el.textContent = text;
    el.className = cls || "status";
  }

  function currentStyleScale() {
    var input = $("input-style-scale");
    var value = input ? parseFloat(input.value) : 1;

    if (!isFinite(value) || value <= 0) {
      value = 1;
    }

    return value;
  }

  function updateStyleScaleLabel() {
    var label = $("style-scale-value");

    if (!label) {
      return;
    }

    label.textContent = currentStyleScale().toFixed(2) + "×";
  }

  function currentLabelFontSize() {
    return numericControlValue("input-label-font-size", 14);
  }

  function updateLabelFontSizeLabel() {
    var label = $("label-font-size-value");

    if (!label) {
      return;
    }

    label.textContent =
      String(parseInt(currentLabelFontSize(), 10));
  }

  function fixedDrawingScaleEnabled() {
    var input = $("opt-fixed-drawing-scale");

    return input ? input.checked : false;
  }

  function currentProjectionScale() {
    var value = numericControlValue("input-projection-scale", 80);

    if (value < 1) {
      value = 80;
    }

    return value;
  }

  function updateProjectionScaleControls() {
    var input = $("input-projection-scale");
    var label = $("projection-scale-value");
    var enabled = fixedDrawingScaleEnabled();

    if (input) {
      input.disabled = !enabled;
    }

    if (label) {
      label.textContent =
        String(parseInt(currentProjectionScale(), 10)) + " px/Å";
    }
  }

  function setProjectionScaleFromLastFit(state) {
    var input = $("input-projection-scale");

    if (!input || !isFinite(state.lastFitScale) || state.lastFitScale <= 0) {
      return;
    }

    var value = state.lastFitScale;
    var min = parseFloat(input.min);
    var max = parseFloat(input.max);
    var step = parseFloat(input.step);

    if (isFinite(min)) {
      value = Math.max(min, value);
    }

    if (isFinite(max)) {
      value = Math.min(max, value);
    }

    if (isFinite(step) && step > 0) {
      var base = isFinite(min) ? min : 0;
      value = base + Math.round((value - base) / step) * step;
    }

    input.value = String(value);
  }

  function numericControlValue(id, fallback) {
    var el = $(id);
    var value = el ? parseFloat(el.value) : fallback;
  
    if (!isFinite(value)) {
      return fallback;
    }
  
    return value;
  }
  
  function updateLimitLabels() {
    var maxAtomsLabel = $("max-atoms-value");
    var maxRadiusLabel = $("max-radius-value");
    var maxDepthLabel = $("max-depth-value");
  
    if (maxAtomsLabel) {
      maxAtomsLabel.textContent =
        String(parseInt(numericControlValue("input-max-atoms", 200), 10));
    }
  
    if (maxRadiusLabel) {
      maxRadiusLabel.textContent =
        String(numericControlValue("input-max-radius", 20)) + " Å";
    }
  
    if (maxDepthLabel) {
      maxDepthLabel.textContent =
        String(parseInt(numericControlValue("input-max-depth", 12), 10));
    }
  }
  
  function currentStartLabel(state) {
    if (!state.model) {
      return "";
    }
  
    var componentSelect = $("select-component");
    var component = componentSelect
      ? componentById(state, componentSelect.value)
      : null;
  
    if (component) {
      return chooseBestAtomInComponent(component);
    }
  
    return chooseDefaultCenterAtom(state.model);
  }

  function atomicNumber(element) {
    var table = {
      H: 1, He: 2,
      Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
      Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18,
      K: 19, Ca: 20, Sc: 21, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26,
      Co: 27, Ni: 28, Cu: 29, Zn: 30, Ga: 31, Ge: 32, As: 33, Se: 34,
      Br: 35, Kr: 36, Rb: 37, Sr: 38, Y: 39, Zr: 40, Nb: 41, Mo: 42,
      Tc: 43, Ru: 44, Rh: 45, Pd: 46, Ag: 47, Cd: 48, In: 49, Sn: 50,
      Sb: 51, Te: 52, I: 53, Xe: 54, Cs: 55, Ba: 56,
      La: 57, Ce: 58, Pr: 59, Nd: 60, Pm: 61, Sm: 62, Eu: 63,
      Gd: 64, Tb: 65, Dy: 66, Ho: 67, Er: 68, Tm: 69, Yb: 70, Lu: 71,
      Hf: 72, Ta: 73, W: 74, Re: 75, Os: 76, Ir: 77, Pt: 78,
      Au: 79, Hg: 80, Tl: 81, Pb: 82, Bi: 83, Po: 84, At: 85, Rn: 86,
      Fr: 87, Ra: 88, Ac: 89, Th: 90, Pa: 91, U: 92
    };

    return table[element] || 0;
  }

  function chooseDefaultCenterAtom(model) {
    var atoms = (model.atoms || []).filter(function (atom) {
      return atom.element !== "H";
    });

    if (!atoms.length) {
      atoms = model.atoms || [];
    }

    if (!atoms.length) {
      return "";
    }

    var best = atoms[0];
    var bestZ = atomicNumber(best.element);

    atoms.forEach(function (atom) {
      var z = atomicNumber(atom.element);

      if (z > bestZ) {
        best = atom;
        bestZ = z;
      }
    });

    return best.label || "";
  }

  function buildBondComponents(model) {
    var atoms = model.atoms || [];
    var atomByLabel = model.atomByLabel || {};
    var adjacency = {};
    var visited = {};
    var components = [];

    atoms.forEach(function (atom) {
      adjacency[atom.label] = adjacency[atom.label] || {};
    });

    (model.bonds || []).forEach(function (bond) {
      var a = bond.atom1Label;
      var b = bond.atom2Label;

      if (!atomByLabel[a] || !atomByLabel[b]) {
        return;
      }

      adjacency[a] = adjacency[a] || {};
      adjacency[b] = adjacency[b] || {};

      adjacency[a][b] = true;
      adjacency[b][a] = true;
    });

    atoms.forEach(function (atom) {
      if (visited[atom.label]) {
        return;
      }

      var queue = [atom.label];
      var labels = [];

      visited[atom.label] = true;

      while (queue.length) {
        var label = queue.shift();

        labels.push(label);

        Object.keys(adjacency[label] || {}).forEach(function (next) {
          if (visited[next]) {
            return;
          }

          visited[next] = true;
          queue.push(next);
        });
      }

      var componentAtoms = labels.map(function (label) {
        return atomByLabel[label];
      }).filter(Boolean);

      components.push({
        id: "component_" + components.length,
        atomLabels: labels,
        atoms: componentAtoms
      });
    });

    components.forEach(function (component) {
      var labelSet = {};

      component.atomLabels.forEach(function (label) {
        labelSet[label] = true;
      });

      component.bondCount = (model.bonds || []).filter(function (bond) {
        return labelSet[bond.atom1Label] && labelSet[bond.atom2Label];
      }).length;

      component.heaviestZ = component.atoms.reduce(function (max, atom) {
        if (atom.element === "H") {
          return max;
        }

        return Math.max(max, atomicNumber(atom.element));
      }, 0);
    });

    components.sort(function (a, b) {
      if (b.heaviestZ !== a.heaviestZ) {
        return b.heaviestZ - a.heaviestZ;
      }

      if (b.atoms.length !== a.atoms.length) {
        return b.atoms.length - a.atoms.length;
      }

      return b.bondCount - a.bondCount;
    });

    components = components.filter(function (component) {
      /*
        Hide isolated hydrogen-only components from the component/moiety list.
        Coordinate H atoms can still be attached to their parent atoms by the
        "Add coordinate H atoms missing from CIF bonds" option.
      */
      if (component.atoms.length === 1 && component.atoms[0].element === "H") {
        return false;
      }

      return true;
    });

    components.forEach(function (component, index) {
      component.id = "component_" + index;
      component.index = index + 1;
    });

    return components;
  }

  function componentFormulaText(component) {
    var counts = {};
    var elements = [];

    (component.atoms || []).forEach(function (atom) {
      var element = atom.element || "";

      if (!element) {
        return;
      }

      if (!counts[element]) {
        counts[element] = 0;
        elements.push(element);
      }

      counts[element]++;
    });

    elements.sort(function (a, b) {
      var za = atomicNumber(a);
      var zb = atomicNumber(b);

      if (za !== zb) {
        return zb - za;
      }

      return a.localeCompare(b);
    });

    return elements.map(function (element) {
      return element + (counts[element] > 1 ? counts[element] : "");
    }).join(" ");
  }

  function componentLabel(component) {
    var formula = componentFormulaText(component);

    if (!formula) {
      formula = "unknown composition";
    }

    return (
      "Component " +
      component.index +
      ": " +
      formula +
      " · " +
      component.atoms.length +
      " atoms"
    );
  }

  function componentById(state, id) {
    return (state.components || []).find(function (component) {
      return component.id === id;
    }) || null;
  }

  function chooseDefaultComponent(components) {
    if (!components || !components.length) {
      return null;
    }

    return components[0];
  }

  function chooseBestAtomInComponent(component) {
    var atoms = (component && component.atoms ? component.atoms : []).filter(function (atom) {
      return atom.element !== "H";
    });

    if (!atoms.length && component && component.atoms) {
      atoms = component.atoms.slice();
    }

    if (!atoms.length) {
      return "";
    }

    var best = atoms[0];
    var bestZ = atomicNumber(best.element);

    atoms.forEach(function (atom) {
      var z = atomicNumber(atom.element);

      if (z > bestZ) {
        best = atom;
        bestZ = z;
      }
    });

    return best.label || "";
  }

  function fillComponentSelect(components) {
    var select = $("select-component");

    if (!select) {
      return;
    }

    components = components || [];

    if (!components.length) {
      select.innerHTML = "<option value=\"\">No components</option>";
      select.disabled = true;
      return;
    }

    select.innerHTML = components.map(function (component) {
      return (
        "<option value=\"" + escapeHtml(component.id) + "\">" +
          escapeHtml(componentLabel(component)) +
        "</option>"
      );
    }).join("");

    select.disabled = false;
  }

  function bondKey(bond) {
    return [bond.atom1Key, bond.atom2Key].sort().join("::");
  }

  function atomMapForFragment(fragment) {
    var map = {};

    (fragment.atoms || []).forEach(function (atom) {
      map[atom.key] = atom;
    });

    return map;
  }

  function overrideValue(value) {
    if (value === true) {
      return "yes";
    }

    if (value === false) {
      return "no";
    }

    return "auto";
  }

  function overrideFromValue(value) {
    if (value === "yes") {
      return true;
    }

    if (value === "no") {
      return false;
    }

    return null;
  }

  function displayBondLabel(bond, atomMap) {
    var a = atomMap[bond.atom1Key];
    var b = atomMap[bond.atom2Key];

    var aLabel = a ? (a.displayLabel || a.label) : bond.atom1Key;
    var bLabel = b ? (b.displayLabel || b.label) : bond.atom2Key;

    return aLabel + "–" + bLabel;
  }

  function atomEffectivelyLabelled(state, atom) {
    var override = state.displayOptions.atomOverrides[atom.key] || {};

    if (override.label === true) {
      return true;
    }

    if (override.label === false) {
      return false;
    }

    /*
      Global label defaults:
      - metals and hetero atoms are labelled
      - C labels depend on Label C atoms
      - H labels depend on Label H atoms
    */
    if (atom.element === "C") {
      return !!state.displayOptions.labelCarbon;
    }

    if (atom.element === "H") {
      return !!state.displayOptions.labelHydrogen;
    }

    return true;
  }

  function renderFragmentTable(fragment) {
    var atoms = (fragment.atoms || []).slice();

    if (!atoms.length) {
      return "<p class=\"hint\">No atoms in fragment.</p>";
    }

    atoms.sort(function (a, b) {
      if (a.key === fragment.start.key) return -1;
      if (b.key === fragment.start.key) return 1;

      return String(a.label).localeCompare(String(b.label), undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });

    return (
      "<table class=\"table\">" +
        "<thead>" +
          "<tr>" +
            "<th>Atom</th>" +
            "<th>Element</th>" +
            "<th>Image</th>" +
            "<th>ADP</th>" +
          "</tr>" +
        "</thead>" +
        "<tbody>" +
          atoms.map(function (atom) {
            var start = atom.key === fragment.start.key
              ? " <strong>(start)</strong>"
              : "";

            return (
              "<tr>" +
                "<td>" + atomLabelHtml(atom) + start + "</td>" +
                "<td>" + escapeHtml(atom.element) + "</td>" +
                "<td>" + escapeHtml(atom.symCode || "identity") + "</td>" +
                "<td>" + (atom.adp ? "Uani" : "—") + "</td>" +
              "</tr>"
            );
          }).join("") +
        "</tbody>" +
      "</table>"
    );
  }

  function symmetryOperationHtml(operation) {
    return escapeHtml(operation)
      .replace(/\b([xyz])\b/g, "<em>$1</em>");
  }

  function renderSymmetryNotes(fragment) {
    var notes = fragment.symmetryNotes || [];

    if (!notes.length) {
      return "";
    }

    var label = notes.length === 1
      ? "Symmetry transformation used to generate equivalent atoms:"
      : "Symmetry transformations used to generate equivalent atoms:";

    return (
      "<h3>Symmetry</h3>" +
      "<p class=\"hint\"><strong>" + escapeHtml(label) + "</strong> " +
        notes.map(function (note) {
          return (
            "(" + escapeHtml(note.symbol) + ") " +
            symmetryOperationHtml(note.operation || note.code || "")
          );
        }).join("; ") +
      ".</p>"
    );
  }

  function renderOverrideTables(state) {
    var atomBox = $("atom-overrides");
    var bondBox = $("bond-overrides");

    if (!state.fragment) {
      if (atomBox) {
        atomBox.innerHTML = "No fragment.";
      }

      if (bondBox) {
        bondBox.innerHTML = "No fragment.";
      }

      return;
    }

    var search = $("override-search")
      ? String($("override-search").value || "").trim().toLowerCase()
      : "";

    var atomOverrides = state.displayOptions.atomOverrides || {};
    var bondOverrides = state.displayOptions.bondOverrides || {};
    var atomMap = atomMapForFragment(state.fragment);

    var atoms = (state.fragment.atoms || []).filter(function (atom) {
      if (!search) {
        return true;
      }

      return (
        String(atom.label || "").toLowerCase().indexOf(search) !== -1 ||
        String(atom.displayLabel || "").toLowerCase().indexOf(search) !== -1 ||
        String(atom.element || "").toLowerCase().indexOf(search) !== -1 ||
        String(atom.symCode || "").toLowerCase().indexOf(search) !== -1
      );
    });

    atoms.sort(function (a, b) {
      if (a.key === state.fragment.start.key) return -1;
      if (b.key === state.fragment.start.key) return 1;

      return String(a.label).localeCompare(String(b.label), undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });

    if (atomBox) {
      if (!atoms.length) {
        atomBox.innerHTML = "<p class=\"hint\">No matching atoms.</p>";
      } else {
        atomBox.innerHTML =
          "<table class=\"table\">" +
            "<thead>" +
              "<tr>" +
                "<th>Atom</th>" +
                "<th>El.</th>" +
                "<th>Img</th>" +
                "<th>Show</th>" +
                "<th>Label</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" +
              atoms.map(function (atom) {
                var ov = atomOverrides[atom.key] || {};
                var showValue = overrideValue(ov.show);
                var labelValue = overrideValue(ov.label);

                return (
                  "<tr>" +
                    "<td>" + atomLabelHtml(atom) + "</td>" +
                    "<td>" + escapeHtml(atom.element) + "</td>" +
                    "<td>" + escapeHtml(atom.symCode || "id") + "</td>" +
                    "<td>" +
                      "<select data-atom-show=\"" + escapeHtml(atom.key) + "\">" +
                        "<option value=\"yes\"" + (showValue === "yes" ? " selected" : "") + ">show</option>" +
                        "<option value=\"no\"" + (showValue === "no" ? " selected" : "") + ">hide</option>" +
                        "<option value=\"auto\"" + (showValue === "auto" ? " selected" : "") + ">auto</option>" +
                      "</select>" +
                    "</td>" +
                    "<td>" +
                      "<select data-atom-label=\"" + escapeHtml(atom.key) + "\">" +
                        "<option value=\"yes\"" + (labelValue === "yes" ? " selected" : "") + ">show</option>" +
                        "<option value=\"no\"" + (labelValue === "no" ? " selected" : "") + ">hide</option>" +
                        "<option value=\"auto\"" + (labelValue === "auto" ? " selected" : "") + ">auto</option>" +
                      "</select>" +
                    "</td>" +
                  "</tr>"
                );
              }).join("") +
            "</tbody>" +
          "</table>";
      }
    }

    var bonds = (state.fragment.bonds || []).filter(function (bond) {
      if (!search) {
        return true;
      }

      return displayBondLabel(bond, atomMap).toLowerCase().indexOf(search) !== -1;
    });

    if (bondBox) {
      if (!bonds.length) {
        bondBox.innerHTML = "<p class=\"hint\">No matching bonds.</p>";
      } else {
        bondBox.innerHTML =
          "<table class=\"table\">" +
            "<thead>" +
              "<tr>" +
                "<th>Bond</th>" +
                "<th>Å</th>" +
                "<th>Show</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" +
              bonds.map(function (bond) {
                var key = bondKey(bond);
                var ov = bondOverrides[key] || {};
                var showValue = overrideValue(ov.show);

                return (
                  "<tr>" +
                    "<td>" + escapeHtml(displayBondLabel(bond, atomMap)) + "</td>" +
                    "<td class=\"number\">" +
                      (isFinite(bond.distance) ? Number(bond.distance).toFixed(3) : "—") +
                    "</td>" +
                    "<td>" +
                      "<select data-bond-show=\"" + escapeHtml(key) + "\">" +
                        "<option value=\"yes\"" + (showValue === "yes" ? " selected" : "") + ">show</option>" +
                        "<option value=\"no\"" + (showValue === "no" ? " selected" : "") + ">hide</option>" +
                        "<option value=\"auto\"" + (showValue === "auto" ? " selected" : "") + ">auto</option>" +
                      "</select>" +
                    "</td>" +
                  "</tr>"
                );
              }).join("") +
            "</tbody>" +
          "</table>";
      }
    }
  }

  function findAtomByKey(fragment, key) {
    return (fragment.atoms || []).find(function (atom) {
      return atom.key === key;
    }) || null;
  }

  function attachedHydrogenAtomsForAtom(fragment, atom) {
    if (!fragment || !atom || atom.element === "H") {
      return [];
    }
  
    return (fragment.atoms || []).filter(function (candidate) {
      return (
        candidate.element === "H" &&
        candidate.attachedToAtomKey === atom.key
      );
    });
  }

  function setAttachedHydrogenVisibility(state, atom, visible) {
    var hydrogens = attachedHydrogenAtomsForAtom(state.fragment, atom);

    hydrogens.forEach(function (hydrogen) {
      state.displayOptions.atomOverrides[hydrogen.key] =
        state.displayOptions.atomOverrides[hydrogen.key] || {};

      state.displayOptions.atomOverrides[hydrogen.key].show = visible;
    });
  }

  function findBondByKey(fragment, key) {
    return (fragment.bonds || []).find(function (bond) {
      return bondKey(bond) === key;
    }) || null;
  }

  function renderSelectedOverride(state) {
    var box = $("selected-override");

    if (!box) {
      return;
    }

    if (!state.fragment || !state.selectedItem) {
      box.innerHTML = "No atom or bond selected.";
      return;
    }

    var atomOverrides = state.displayOptions.atomOverrides || {};
    var bondOverrides = state.displayOptions.bondOverrides || {};

    if (state.selectedItem.type === "atom") {
      var atom = findAtomByKey(state.fragment, state.selectedItem.key);

      if (!atom) {
        box.innerHTML = "Selected atom is no longer available.";
        return;
      }

      var atomOverride = atomOverrides[atom.key] || {};
      var attachedHydrogens = attachedHydrogenAtomsForAtom(state.fragment, atom);
      var attachedHydrogenText = attachedHydrogens.length
        ? attachedHydrogens.map(function (hydrogen) {
            return atomLabelHtml(hydrogen);
          }).join(", ")
        : "";

      box.innerHTML =
        "<div><strong>Atom:</strong> " + atomLabelHtml(atom) + "</div>" +
        "<div><strong>Element:</strong> " + escapeHtml(atom.element) + "</div>" +
        "<div><strong>Image:</strong> " + escapeHtml(atom.symCode || "identity") + "</div>" +
        (attachedHydrogens.length
          ? "<div><strong>Attached H:</strong> " + attachedHydrogenText + "</div>"
          : "") +
        "<div class=\"selected-actions\">" +
          "<label>Show" +
            "<select data-selected-atom-show=\"" + escapeHtml(atom.key) + "\">" +
              "<option value=\"yes\"" + (overrideValue(atomOverride.show) === "yes" ? " selected" : "") + ">show</option>" +
              "<option value=\"no\"" + (overrideValue(atomOverride.show) === "no" ? " selected" : "") + ">hide</option>" +
              "<option value=\"auto\"" + (overrideValue(atomOverride.show) === "auto" ? " selected" : "") + ">auto</option>" +
            "</select>" +
          "</label>" +
          "<label>Label" +
            "<select data-selected-atom-label=\"" + escapeHtml(atom.key) + "\">" +
              "<option value=\"yes\"" + (overrideValue(atomOverride.label) === "yes" ? " selected" : "") + ">show</option>" +
              "<option value=\"no\"" + (overrideValue(atomOverride.label) === "no" ? " selected" : "") + ">hide</option>" +
              "<option value=\"auto\"" + (overrideValue(atomOverride.label) === "auto" ? " selected" : "") + ">auto</option>" +
            "</select>" +
          "</label>" +
          (attachedHydrogens.length
            ? "<div class=\"button-row\">" +
                "<button type=\"button\" data-selected-attached-h-show=\"" + escapeHtml(atom.key) + "\">Show attached H</button>" +
                "<button type=\"button\" data-selected-attached-h-hide=\"" + escapeHtml(atom.key) + "\">Hide attached H</button>" +
              "</div>"
            : "") +
        "</div>";

      return;
    }

    if (state.selectedItem.type === "bond") {
      var bond = findBondByKey(state.fragment, state.selectedItem.key);

      if (!bond) {
        box.innerHTML = "Selected bond is no longer available.";
        return;
      }

      var atomMap = atomMapForFragment(state.fragment);
      var bondOverride = bondOverrides[state.selectedItem.key] || {};

      box.innerHTML =
        "<div><strong>Bond:</strong> " + escapeHtml(displayBondLabel(bond, atomMap)) + "</div>" +
        "<div><strong>Distance:</strong> " +
          (isFinite(bond.distance) ? Number(bond.distance).toFixed(3) + " Å" : "—") +
        "</div>" +
        "<div class=\"selected-actions\">" +
          "<label>Show" +
            "<select data-selected-bond-show=\"" + escapeHtml(state.selectedItem.key) + "\">" +
              "<option value=\"yes\"" + (overrideValue(bondOverride.show) === "yes" ? " selected" : "") + ">show</option>" +
              "<option value=\"no\"" + (overrideValue(bondOverride.show) === "no" ? " selected" : "") + ">hide</option>" +
              "<option value=\"auto\"" + (overrideValue(bondOverride.show) === "auto" ? " selected" : "") + ">auto</option>" +
            "</select>" +
          "</label>" +
        "</div>";
    }
  }

  function createState() {
    return {
      parsed: null,
      model: null,
      components: [],
      fragment: null,
      viewState: null,
      lastSvg: "",
      sourceFilename: "",
      lastFitScale: null,
  
      displayOptions: {
        showHydrogen: true,
        labelCarbon: false,
        labelHydrogen: false,
        atomOverrides: {},
        bondOverrides: {}
      },
  
      selectedItem: null,
  
      dragging: false,
      dragMoved: false,
      lastMouse: null,
      renderPending: false
    };
  }

  function svgSize(svgText) {
    var doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    var svg = doc.documentElement;

    var width = parseFloat(svg.getAttribute("width"));
    var height = parseFloat(svg.getAttribute("height"));

    if (isFinite(width) && isFinite(height)) {
      return {
        width: width,
        height: height
      };
    }

    var viewBox = String(svg.getAttribute("viewBox") || "").trim().split(/\s+/);

    if (viewBox.length === 4) {
      width = parseFloat(viewBox[2]);
      height = parseFloat(viewBox[3]);

      if (isFinite(width) && isFinite(height)) {
        return {
          width: width,
          height: height
        };
      }
    }

    return {
      width: 1100,
      height: 800
    };
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

function filenameBase(filename) {
  filename = String(filename || "").trim();

  if (!filename) {
    return "ortep";
  }

  filename = filename.replace(/^.*[\\/]/, "");
  filename = filename.replace(/\.[^.]*$/, "");

  return filename || "ortep";
}

function safeFilenamePart(value) {
  value = String(value || "").trim();

  if (!value) {
    return "";
  }

  return value
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

  function currentComponentFilenamePart(state) {
    var componentSelect = $("select-component");
  
    if (!componentSelect || !state.components || !state.components.length) {
      return "";
    }
  
    var component = componentById(state, componentSelect.value);
  
    if (!component) {
      return "";
    }
  
    /*
      Keep it short and stable.
      Example: component_1_Cu2_Br2_N12_C25
    */
    var formula = componentFormulaText(component);
  
    return safeFilenamePart(
      "component_" +
      component.index +
      (formula ? "_" + formula.replace(/\s+/g, "_") : "")
    );
  }
  
  function currentExportBaseName(state) {
    var base = safeFilenamePart(filenameBase(state.sourceFilename));
  
    var componentPart = currentComponentFilenamePart(state);
  
    if (componentPart) {
      return base + "_" + componentPart + "_ortep";
    }
  
    if (state.fragment && state.fragment.start) {
      return base + "_" + safeFilenamePart(state.fragment.start.label) + "_ortep";
    }
  
    return base + "_ortep";
  }

  function downloadPngFromSvg(svgText, filename, dpi) {
    dpi = dpi || 300;

    /*
      Browser canvas PNG export does not reliably embed DPI metadata.
      We therefore export a 300-dpi-equivalent pixel size using the
      CSS pixel reference of 96 dpi.
    */
    var scale = dpi / 96;
    var size = svgSize(svgText);

    var svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8"
    });

    var url = URL.createObjectURL(svgBlob);
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement("canvas");

      canvas.width = Math.round(size.width * scale);
      canvas.height = Math.round(size.height * scale);

      var ctx = canvas.getContext("2d");

      /*
        White background for publication/Word-friendly PNG.
      */
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      canvas.toBlob(function (blob) {
        if (!blob) {
          return;
        }

        downloadBlob(filename, blob);
      }, "image/png");
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      alert("PNG export failed.");
    };

    img.src = url;
  }

  function init() {
    var state = createState();

    window.ortepState = state;

    function renderSvgOnly() {
      if (!state.model || !state.fragment || !state.viewState) {
        return;
      }

      state.displayOptions.showHydrogen = $("opt-show-h")
        ? $("opt-show-h").checked
        : true;

      state.displayOptions.labelCarbon = $("opt-label-c")
        ? $("opt-label-c").checked
        : false;

      state.displayOptions.labelHydrogen = $("opt-label-h")
        ? $("opt-label-h").checked
        : false;

      var probability = parseInt($("select-probability").value, 10);
      var showLabels = $("opt-show-labels").checked;
      var showBackfaces = $("opt-show-backfaces").checked;
      
      var twoColoredBonds = $("opt-two-colored-bonds")
        ? $("opt-two-colored-bonds").checked
        : false;

      var svg = CIFLord.OrtepSvg.makeSvg(state.fragment, {
        width: 1100,
        height: 800,
        probability: probability,
        ellipsoidScale: 1,
        styleScale: currentStyleScale(),
        fixedDrawingScale: fixedDrawingScaleEnabled(),
        projectionScale: currentProjectionScale(),
        labelFontSize: currentLabelFontSize(),
        showLabels: showLabels,
        showBackfaces: showBackfaces,
        twoColoredBonds: twoColoredBonds,
        viewState: state.viewState,
        displayOptions: state.displayOptions
      });
      state.lastSvg = svg;

      $("svg-output").innerHTML = svg;

      var renderedSvg = $("svg-output").querySelector("svg");

      if (renderedSvg && !fixedDrawingScaleEnabled()) {
        var fitScale = parseFloat(renderedSvg.getAttribute("data-fit-scale"));

        if (isFinite(fitScale) && fitScale > 0) {
          state.lastFitScale = fitScale;
          setProjectionScaleFromLastFit(state);
          updateProjectionScaleControls();
        }
      }

      $("btn-download").disabled = false;

      if ($("btn-download-png")) {
        $("btn-download-png").disabled = false;
      }
    }

    function render() {
      if (!state.model) {
        return;
      }

      var centerLabel = currentStartLabel(state);
      var probability = parseInt($("select-probability").value, 10);
      
      if (!centerLabel) {
        return;
      }

      var fragment = CIFLord.OrtepSvg.makeBondedComponentForAtom(
        state.model,
        centerLabel,
        {
          showHydrogen: true,
          addMissingHydrogenAtoms: $("opt-add-missing-h")
            ? $("opt-add-missing-h").checked
            : true,
           maxAtoms: parseInt(numericControlValue("input-max-atoms", 200), 10),
           maxRadius: numericControlValue("input-max-radius", 20),
           maxDepth: parseInt(numericControlValue("input-max-depth", 12), 10)
        }
      );

      state.fragment = fragment;

      state.viewState = CIFLord.OrtepSvg.makeViewState(fragment, {
        probability: probability,
        ellipsoidScale: 1,
        model: state.model
      });

      if ($("symmetry-notes")) {
        $("symmetry-notes").innerHTML = renderSymmetryNotes(fragment);
      }

      renderOverrideTables(state);
      renderSelectedOverride(state);
      renderSvgOnly();
    }

    function bindFileInput() {
      $("file-input").addEventListener("change", function () {
        var file = this.files && this.files[0];

        if (!file) {
          return;
        }

        file.text().then(function (text) {
          try {
            var parsed = CIFLord.Parser.parse(text);
            var model = CIFLord.OrtepSvg.parseCif(parsed);

            state.parsed = parsed;
            state.model = model;
            state.components = buildBondComponents(model);
            state.fragment = null;
            state.viewState = null;
            state.lastSvg = "";
            state.sourceFilename = file.name || "";
            state.displayOptions.atomOverrides = {};
            state.displayOptions.bondOverrides = {};
            state.selectedItem = null;

            fillComponentSelect(state.components);

            var defaultComponent = chooseDefaultComponent(state.components);
            var componentSelect = $("select-component");
            
            if (componentSelect && defaultComponent) {
              componentSelect.value = defaultComponent.id;
            }
            
            var defaultCenter = defaultComponent
              ? chooseBestAtomInComponent(defaultComponent)
              : chooseDefaultCenterAtom(model);

            $("btn-download").disabled = true;
            $("svg-output").innerHTML = "";

            if ($("symmetry-notes")) {
              $("symmetry-notes").innerHTML = "";
            }

            renderOverrideTables(state);
            renderSelectedOverride(state);

            setText(
              "load-status",
              file.name + " loaded · " +
                model.atoms.length + " atoms · " +
                model.bonds.length + " CIF bonds · " +
                model.adpCount + " anisotropic ADPs",
              "status"
            );

            if (model.atoms.length && defaultCenter) {
              render();
            }
          } catch (e) {
            console.error(e);
            setText("load-status", "Parse error: " + e.message, "status error");
          }
        });
      });
    }

    function bindButtons() {

      $("btn-download").addEventListener("click", function () {
        if (!state.lastSvg) {
          return;
        }
      
        var exportBase = currentExportBaseName(state);
      
        var blob = new Blob([state.lastSvg], {
          type: "image/svg+xml;charset=utf-8"
        });
      
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
      
        a.href = url;
        a.download = exportBase + ".svg";
      
        document.body.appendChild(a);
        a.click();
      
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 0);
      });
      var pngButton = $("btn-download-png");

      if (pngButton) {
        pngButton.addEventListener("click", function () {
          if (!state.lastSvg) {
            return;
          }

          var exportBase = currentExportBaseName(state);
          
          downloadPngFromSvg(
            state.lastSvg,
            exportBase + "_300dpi.png",
            300
          );
        });
      }
    }

    function bindRenderControls() {
      var componentSelect = $("select-component");

      if (componentSelect) {
        componentSelect.addEventListener("change", function () {
          if (!state.model) {
            return;
          }
        
          render();
        });
      }

      [
        "select-probability",
        "input-style-scale",
        "opt-show-labels",
        "opt-show-backfaces",
        "opt-two-colored-bonds",
        "opt-show-h",
        "opt-label-c",
        "opt-label-h"
      ].forEach(function (id) {
        var el = $(id);

        if (!el) {
          return;
        }

        el.addEventListener("change", function () {
          if (!state.fragment) {
            return;
          }

          updateStyleScaleLabel();
          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
        });
      });

      var styleScaleInput = $("input-style-scale");
      
      if (styleScaleInput) {
        styleScaleInput.addEventListener("input", function () {
          updateStyleScaleLabel();
      
          if (state.fragment) {
            renderSvgOnly();
          }
        });
      }

      var labelFontSizeInput = $("input-label-font-size");

      if (labelFontSizeInput) {
        labelFontSizeInput.addEventListener("input", function () {
          updateLabelFontSizeLabel();

          if (state.fragment) {
            renderSvgOnly();
          }
        });
      }

      var fixedDrawingScaleInput = $("opt-fixed-drawing-scale");

      if (fixedDrawingScaleInput) {
        fixedDrawingScaleInput.addEventListener("change", function () {
          if (fixedDrawingScaleInput.checked) {
            setProjectionScaleFromLastFit(state);
          }

          updateProjectionScaleControls();

          if (state.fragment) {
            renderSvgOnly();
          }
        });
      }

      var projectionScaleInput = $("input-projection-scale");

      if (projectionScaleInput) {
        projectionScaleInput.addEventListener("input", function () {
          updateProjectionScaleControls();

          if (state.fragment) {
            renderSvgOnly();
          }
        });
      }

      [
        "input-max-atoms",
        "input-max-radius",
        "input-max-depth"
      ].forEach(function (id) {
        var el = $(id);

        if (!el) {
          return;
        }

        el.addEventListener("input", function () {
          updateLimitLabels();
        });
      });

      [
        "opt-add-missing-h",
        "input-max-atoms",
        "input-max-radius",
        "input-max-depth"
      ].forEach(function (id) {
        var el = $(id);

        if (!el) {
          return;
        }

        el.addEventListener("change", function () {
          if (state.model) {
            render();
          }
        });
      });

      var search = $("override-search");

      if (search) {
        search.addEventListener("input", function () {
          renderOverrideTables(state);
        });
      }
    }

    function bindOverrideControls() {
      document.body.addEventListener("change", function (event) {
        var target = event.target;

        if (target.matches("[data-selected-atom-show]")) {
          var selectedAtomKey = target.getAttribute("data-selected-atom-show");

          state.displayOptions.atomOverrides[selectedAtomKey] =
            state.displayOptions.atomOverrides[selectedAtomKey] || {};

          state.displayOptions.atomOverrides[selectedAtomKey].show =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
          return;
        }

        if (target.matches("[data-selected-atom-label]")) {
          var selectedLabelAtomKey = target.getAttribute("data-selected-atom-label");

          state.displayOptions.atomOverrides[selectedLabelAtomKey] =
            state.displayOptions.atomOverrides[selectedLabelAtomKey] || {};

          state.displayOptions.atomOverrides[selectedLabelAtomKey].label =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
          return;
        }

        if (target.matches("[data-selected-bond-show]")) {
          var selectedBondKey = target.getAttribute("data-selected-bond-show");

          state.displayOptions.bondOverrides[selectedBondKey] =
            state.displayOptions.bondOverrides[selectedBondKey] || {};

          state.displayOptions.bondOverrides[selectedBondKey].show =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
          return;
        }

        if (target.matches("[data-atom-show]")) {
          var atomKey = target.getAttribute("data-atom-show");

          state.displayOptions.atomOverrides[atomKey] =
            state.displayOptions.atomOverrides[atomKey] || {};

          state.displayOptions.atomOverrides[atomKey].show =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
          return;
        }

        if (target.matches("[data-atom-label]")) {
          var labelAtomKey = target.getAttribute("data-atom-label");

          state.displayOptions.atomOverrides[labelAtomKey] =
            state.displayOptions.atomOverrides[labelAtomKey] || {};

          state.displayOptions.atomOverrides[labelAtomKey].label =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
          return;
        }

        if (target.matches("[data-bond-show]")) {
          var bondOverrideKey = target.getAttribute("data-bond-show");

          state.displayOptions.bondOverrides[bondOverrideKey] =
            state.displayOptions.bondOverrides[bondOverrideKey] || {};

          state.displayOptions.bondOverrides[bondOverrideKey].show =
            overrideFromValue(target.value);

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
        }
      });

      document.body.addEventListener("click", function (event) {
        var target = event.target;

        if (
          !target.matches("[data-selected-attached-h-show]") &&
          !target.matches("[data-selected-attached-h-hide]")
        ) {
          return;
        }

        var atomKey =
          target.getAttribute("data-selected-attached-h-show") ||
          target.getAttribute("data-selected-attached-h-hide");

        var atom = findAtomByKey(state.fragment, atomKey);

        if (!atom) {
          return;
        }

        var visible = target.matches("[data-selected-attached-h-show]");

        setAttachedHydrogenVisibility(state, atom, visible);

        renderSvgOnly();
        renderOverrideTables(state);
        renderSelectedOverride(state);
      });
    }

    function bindResetButtons() {
      var showHidden = $("btn-show-hidden-atoms");
      var resetOverrides = $("btn-reset-overrides");

      if (showHidden) {
        showHidden.addEventListener("click", function () {
          Object.keys(state.displayOptions.atomOverrides || {}).forEach(function (key) {
            var override = state.displayOptions.atomOverrides[key];

            if (override && override.show === false) {
              override.show = null;
            }
          });

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
        });
      }

      if (resetOverrides) {
        resetOverrides.addEventListener("click", function () {
          state.displayOptions.atomOverrides = {};
          state.displayOptions.bondOverrides = {};
          state.selectedItem = null;

          renderSvgOnly();
          renderOverrideTables(state);
          renderSelectedOverride(state);
        });
      }
    }

    function bindSvgSelection() {
      var svgBox = $("svg-output");

      if (!svgBox) {
        return;
      }

      svgBox.addEventListener("click", function (event) {
        if (!state.fragment || state.dragMoved) {
          return;
        }

        var atomEl = event.target.closest("[data-atom-key]");
        var bondEl = event.target.closest("[data-bond-key]");

        var useCommand = event.ctrlKey || event.metaKey;
        var useShift = event.shiftKey;

        if (atomEl) {
          var atomKey = atomEl.getAttribute("data-atom-key");
          var atom = findAtomByKey(state.fragment, atomKey);

          if (!atom) {
            return;
          }

          state.selectedItem = {
            type: "atom",
            key: atomKey
          };

          /*
            Shift + Ctrl/Cmd:
            show attached coordinate H atoms for this exact atom instance.
          */
          if (useShift && useCommand) {
            event.preventDefault();

            setAttachedHydrogenVisibility(state, atom, true);

            renderSvgOnly();
            renderOverrideTables(state);
            renderSelectedOverride(state);
            return;
          }

          /*
            Shift:
            show/hide this atom label.
          */
          if (useShift) {
            event.preventDefault();

            state.displayOptions.atomOverrides[atomKey] =
              state.displayOptions.atomOverrides[atomKey] || {};

            var currentlyLabelled = atomEffectivelyLabelled(state, atom);

            state.displayOptions.atomOverrides[atomKey].label =
              currentlyLabelled ? false : true;

            renderSvgOnly();
            renderOverrideTables(state);
            renderSelectedOverride(state);
            return;
          }

           /*
            Ctrl on Windows/Linux or Cmd on macOS:
            hide this atom.

            Hidden atoms are no longer clickable in the SVG. They can be
            restored from the Selected item panel, the override table, or the
            "Show hidden atoms" / "Reset overrides" buttons.
          */
          if (useCommand) {
            event.preventDefault();

            state.displayOptions.atomOverrides[atomKey] =
              state.displayOptions.atomOverrides[atomKey] || {};

            state.displayOptions.atomOverrides[atomKey].show = false;

            renderSvgOnly();
            renderOverrideTables(state);
            renderSelectedOverride(state);
            return;
          }

          renderSelectedOverride(state);
          return;
        }

        if (bondEl) {
          var selectedBondKey = bondEl.getAttribute("data-bond-key");

          state.selectedItem = {
            type: "bond",
            key: selectedBondKey
          };

          /*
            Ctrl on Windows/Linux or Cmd on macOS:
            hide this bond.

            Hidden bonds can be restored from the Selected item panel,
            the override table, or by resetting overrides.
          */
          if (useCommand) {
            event.preventDefault();

            state.displayOptions.bondOverrides[selectedBondKey] =
              state.displayOptions.bondOverrides[selectedBondKey] || {};

            state.displayOptions.bondOverrides[selectedBondKey].show = false;

            renderSvgOnly();
            renderOverrideTables(state);
            renderSelectedOverride(state);
            return;
          }

          renderSelectedOverride(state);
        }
      });

      /*
        Prevent browser context menu for Ctrl-click on clickable SVG items.
        On macOS, Cmd-click is recommended because Ctrl-click is often used
        for context menus.
      */
      svgBox.addEventListener("contextmenu", function (event) {
        if (
          event.target.closest("[data-atom-key]") ||
          event.target.closest("[data-bond-key]")
        ) {
          event.preventDefault();
        }
      });
    }

    function bindMouseRotation() {
      var svgBox = $("svg-output");

      svgBox.addEventListener("mousedown", function (event) {
        if (!state.fragment || !state.viewState) {
          return;
        }

        state.dragging = true;
        state.dragMoved = false;
        state.lastMouse = {
          x: event.clientX,
          y: event.clientY
        };

        event.preventDefault();
      });

      window.addEventListener("mousemove", function (event) {
        if (!state.dragging || !state.lastMouse || !state.viewState) {
          return;
        }

        var dx = event.clientX - state.lastMouse.x;
        var dy = event.clientY - state.lastMouse.y;

        if (Math.abs(dx) + Math.abs(dy) > 2) {
          state.dragMoved = true;
        }

        state.lastMouse = {
          x: event.clientX,
          y: event.clientY
        };

        state.viewState.view = CIFLord.OrtepSvg.rotateView(
          state.viewState.view,
          dx,
          dy,
          0.008
        );

        if (!state.renderPending) {
          state.renderPending = true;

          requestAnimationFrame(function () {
            state.renderPending = false;
            renderSvgOnly();
          });
        }
      });

      window.addEventListener("mouseup", function () {
        state.dragging = false;
        state.lastMouse = null;

        setTimeout(function () {
          state.dragMoved = false;
        }, 0);
      });

      svgBox.addEventListener("dblclick", function () {
        if (!state.fragment || !state.model) {
          return;
        }

        state.viewState = CIFLord.OrtepSvg.makeViewState(state.fragment, {
          probability: parseInt($("select-probability").value, 10),
          ellipsoidScale: 1,
          model: state.model
        });

        renderSvgOnly();
      });
    }

    updateStyleScaleLabel();
    updateLabelFontSizeLabel();
    updateProjectionScaleControls();
    updateLimitLabels();
    bindFileInput();
    bindButtons();
    bindRenderControls();
    bindOverrideControls();
    bindResetButtons();
    bindSvgSelection();
    bindMouseRotation();
  }

  CIFLord.OrtepApp = {
    init: init
  };

  window.addEventListener("DOMContentLoaded", function () {
    CIFLord.OrtepApp.init();
  });
})();